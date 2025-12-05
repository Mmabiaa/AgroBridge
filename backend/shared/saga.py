"""
Saga Pattern Implementation
Provides distributed transaction management across microservices
"""

import logging
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import uuid
from django.db import models
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class SagaStatus(Enum):
    """Saga execution status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"
    FAILED = "failed"


class StepStatus(Enum):
    """Saga step status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"


@dataclass
class SagaStep:
    """
    Represents a single step in a saga
    """
    name: str
    action: Callable[[Dict[str, Any]], Dict[str, Any]]
    compensation: Callable[[Dict[str, Any]], None]
    status: StepStatus = StepStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class SagaDefinition:
    """
    Defines a saga with its steps
    """
    saga_id: str
    name: str
    steps: List[SagaStep] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    status: SagaStatus = SagaStatus.PENDING
    current_step: int = 0
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def add_step(
        self,
        name: str,
        action: Callable[[Dict[str, Any]], Dict[str, Any]],
        compensation: Callable[[Dict[str, Any]], None],
        max_retries: int = 3
    ):
        """Add a step to the saga"""
        step = SagaStep(
            name=name,
            action=action,
            compensation=compensation,
            max_retries=max_retries
        )
        self.steps.append(step)


class SagaOrchestrator:
    """
    Orchestrates saga execution with compensation
    """
    
    def __init__(self):
        self.sagas: Dict[str, SagaDefinition] = {}
    
    def create_saga(self, name: str, context: Optional[Dict[str, Any]] = None) -> SagaDefinition:
        """
        Create a new saga
        
        Args:
            name: Saga name
            context: Initial context data
            
        Returns:
            SagaDefinition
        """
        saga_id = str(uuid.uuid4())
        saga = SagaDefinition(
            saga_id=saga_id,
            name=name,
            context=context or {}
        )
        self.sagas[saga_id] = saga
        logger.info(f"Created saga {saga_id}: {name}")
        return saga
    
    def execute_saga(self, saga: SagaDefinition) -> bool:
        """
        Execute a saga
        
        Args:
            saga: Saga to execute
            
        Returns:
            True if saga completed successfully, False otherwise
        """
        saga.status = SagaStatus.IN_PROGRESS
        saga.updated_at = datetime.utcnow().isoformat()
        
        logger.info(f"Executing saga {saga.saga_id}: {saga.name}")
        
        try:
            # Execute each step
            for i, step in enumerate(saga.steps):
                saga.current_step = i
                
                if not self._execute_step(saga, step):
                    # Step failed, start compensation
                    logger.error(f"Step {step.name} failed, starting compensation")
                    self._compensate_saga(saga, i)
                    saga.status = SagaStatus.FAILED
                    return False
            
            # All steps completed successfully
            saga.status = SagaStatus.COMPLETED
            saga.updated_at = datetime.utcnow().isoformat()
            logger.info(f"Saga {saga.saga_id} completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Saga {saga.saga_id} failed with exception: {e}")
            saga.status = SagaStatus.FAILED
            saga.updated_at = datetime.utcnow().isoformat()
            
            # Attempt compensation
            self._compensate_saga(saga, saga.current_step)
            return False
    
    def _execute_step(self, saga: SagaDefinition, step: SagaStep) -> bool:
        """
        Execute a single saga step with retry logic
        
        Args:
            saga: Parent saga
            step: Step to execute
            
        Returns:
            True if step succeeded, False otherwise
        """
        step.status = StepStatus.IN_PROGRESS
        logger.info(f"Executing step: {step.name}")
        
        while step.retry_count <= step.max_retries:
            try:
                # Execute step action
                result = step.action(saga.context)
                
                # Update context with result
                saga.context.update(result)
                
                # Mark step as completed
                step.status = StepStatus.COMPLETED
                step.result = result
                logger.info(f"Step {step.name} completed successfully")
                return True
                
            except Exception as e:
                step.retry_count += 1
                step.error = str(e)
                logger.error(f"Step {step.name} failed (attempt {step.retry_count}/{step.max_retries}): {e}")
                
                if step.retry_count > step.max_retries:
                    step.status = StepStatus.FAILED
                    return False
        
        return False
    
    def _compensate_saga(self, saga: SagaDefinition, failed_step_index: int):
        """
        Compensate a saga by executing compensation actions in reverse order
        
        Args:
            saga: Saga to compensate
            failed_step_index: Index of the step that failed
        """
        saga.status = SagaStatus.COMPENSATING
        logger.info(f"Compensating saga {saga.saga_id}")
        
        # Compensate completed steps in reverse order
        for i in range(failed_step_index, -1, -1):
            step = saga.steps[i]
            
            if step.status == StepStatus.COMPLETED:
                self._compensate_step(saga, step)
        
        saga.status = SagaStatus.COMPENSATED
        saga.updated_at = datetime.utcnow().isoformat()
        logger.info(f"Saga {saga.saga_id} compensated")
    
    def _compensate_step(self, saga: SagaDefinition, step: SagaStep):
        """
        Compensate a single step
        
        Args:
            saga: Parent saga
            step: Step to compensate
        """
        step.status = StepStatus.COMPENSATING
        logger.info(f"Compensating step: {step.name}")
        
        try:
            step.compensation(saga.context)
            step.status = StepStatus.COMPENSATED
            logger.info(f"Step {step.name} compensated successfully")
            
        except Exception as e:
            logger.error(f"Failed to compensate step {step.name}: {e}")
            # Continue with other compensations even if one fails
    
    def get_saga(self, saga_id: str) -> Optional[SagaDefinition]:
        """Get saga by ID"""
        return self.sagas.get(saga_id)


# Singleton orchestrator
_orchestrator = None


def get_saga_orchestrator() -> SagaOrchestrator:
    """Get singleton saga orchestrator"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SagaOrchestrator()
    return _orchestrator


# Example saga implementations

def create_order_saga(order_data: Dict[str, Any]) -> SagaDefinition:
    """
    Create order saga with payment and inventory management
    
    Steps:
    1. Reserve inventory
    2. Process payment
    3. Create order
    4. Send notification
    """
    orchestrator = get_saga_orchestrator()
    saga = orchestrator.create_saga("create_order", context=order_data)
    
    # Step 1: Reserve inventory
    def reserve_inventory(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Reserving inventory for order")
        # Call inventory service to reserve items
        # This would be an actual API call in production
        return {"inventory_reserved": True, "reservation_id": str(uuid.uuid4())}
    
    def release_inventory(context: Dict[str, Any]):
        logger.info(f"Releasing inventory reservation")
        # Call inventory service to release reservation
        # This would be an actual API call in production
    
    saga.add_step(
        name="reserve_inventory",
        action=reserve_inventory,
        compensation=release_inventory
    )
    
    # Step 2: Process payment
    def process_payment(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Processing payment for order")
        # Call payment service to process payment
        # This would be an actual API call in production
        return {"payment_processed": True, "transaction_id": str(uuid.uuid4())}
    
    def refund_payment(context: Dict[str, Any]):
        logger.info(f"Refunding payment")
        # Call payment service to refund payment
        # This would be an actual API call in production
    
    saga.add_step(
        name="process_payment",
        action=process_payment,
        compensation=refund_payment
    )
    
    # Step 3: Create order
    def create_order(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Creating order")
        # Create order in database
        # This would be an actual database operation in production
        return {"order_created": True, "order_id": str(uuid.uuid4())}
    
    def cancel_order(context: Dict[str, Any]):
        logger.info(f"Cancelling order")
        # Cancel order in database
        # This would be an actual database operation in production
    
    saga.add_step(
        name="create_order",
        action=create_order,
        compensation=cancel_order
    )
    
    # Step 4: Send notification
    def send_notification(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Sending order confirmation notification")
        # Call notification service
        # This would be an actual API call in production
        return {"notification_sent": True}
    
    def no_compensation(context: Dict[str, Any]):
        # Notifications don't need compensation
        pass
    
    saga.add_step(
        name="send_notification",
        action=send_notification,
        compensation=no_compensation
    )
    
    return saga


def create_payment_saga(payment_data: Dict[str, Any]) -> SagaDefinition:
    """
    Create payment saga with escrow management
    
    Steps:
    1. Validate payment details
    2. Hold funds in escrow
    3. Update order status
    4. Send confirmation
    """
    orchestrator = get_saga_orchestrator()
    saga = orchestrator.create_saga("process_payment", context=payment_data)
    
    # Step 1: Validate payment
    def validate_payment(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Validating payment details")
        # Validate payment details
        return {"payment_valid": True}
    
    def no_compensation(context: Dict[str, Any]):
        pass
    
    saga.add_step(
        name="validate_payment",
        action=validate_payment,
        compensation=no_compensation
    )
    
    # Step 2: Hold funds in escrow
    def hold_escrow(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Holding funds in escrow")
        # Call payment gateway to hold funds
        return {"escrow_held": True, "escrow_id": str(uuid.uuid4())}
    
    def release_escrow(context: Dict[str, Any]):
        logger.info(f"Releasing escrow funds")
        # Call payment gateway to release funds
    
    saga.add_step(
        name="hold_escrow",
        action=hold_escrow,
        compensation=release_escrow
    )
    
    # Step 3: Update order status
    def update_order(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Updating order status")
        # Update order status in database
        return {"order_updated": True}
    
    def revert_order_status(context: Dict[str, Any]):
        logger.info(f"Reverting order status")
        # Revert order status in database
    
    saga.add_step(
        name="update_order",
        action=update_order,
        compensation=revert_order_status
    )
    
    # Step 4: Send confirmation
    def send_confirmation(context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"Sending payment confirmation")
        # Send confirmation notification
        return {"confirmation_sent": True}
    
    saga.add_step(
        name="send_confirmation",
        action=send_confirmation,
        compensation=no_compensation
    )
    
    return saga
