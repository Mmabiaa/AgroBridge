from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..routers.auth import get_current_user
from ..models.user import User
from ..models.permissions import Permission, get_user_permissions

router = APIRouter(prefix="/api/voice", tags=["voice"])

class VoiceCommandIn(BaseModel):
  command: str

class VoiceCommandOut(BaseModel):
  command: str
  action: str
  success: bool
  message: str

@router.post("/command", response_model=VoiceCommandOut)
async def process_voice_command(payload: VoiceCommandIn, current_user: User = Depends(get_current_user)):
  perms = get_user_permissions(current_user.role.value)
  if Permission.USE_VOICE_COMMANDS not in perms:
    raise HTTPException(status_code=403, detail="Voice commands not permitted for your role")

  cmd = payload.command.strip().lower()
  # Very basic parser stub; real logic can be injected via service layer
  if "open" in cmd and "market" in cmd:
    return VoiceCommandOut(command=payload.command, action="navigate:/marketplace", success=True, message="Navigating to marketplace")
  if "weather" in cmd:
    return VoiceCommandOut(command=payload.command, action="navigate:/dashboard", success=True, message="Showing weather on dashboard")

  return VoiceCommandOut(command=payload.command, action="noop", success=True, message="Command received") 