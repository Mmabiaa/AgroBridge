import { authHandlers } from './auth.handlers.js';
import { farmsHandlers } from './farms.handlers.js';
import { marketplaceHandlers } from './marketplace.handlers.js';
import { aiHandlers } from './ai.handlers.js';
import { cropDetectionHandlers } from './crop-detection.handlers.js';
import { iotHandlers } from './iot.handlers.js';
import { notificationsHandlers } from './notifications.handlers.js';
import { financialHandlers } from './financial.handlers.js';
import { learningHandlers } from './learning.handlers.js';
import { communityHandlers } from './community.handlers.js';
import { schedulingHandlers } from './scheduling.handlers.js';
import { analyticsHandlers } from './analytics.handlers.js';
import { paymentHandlers } from './payment.handlers.js';
import { blockchainHandlers } from './blockchain.handlers.js';
import { exportDocsHandlers } from './export-docs.handlers.js';
import { emergencyHandlers } from './emergency.handlers.js';
import { adminHandlers } from './admin.handlers.js';
import { usersHandlers } from './users.handlers.js';

/**
 * All MSW request handlers for 18 microservices
 */
export const handlers = [
    ...authHandlers,
    ...usersHandlers,
    ...farmsHandlers,
    ...marketplaceHandlers,
    ...aiHandlers,
    ...cropDetectionHandlers,
    ...iotHandlers,
    ...notificationsHandlers,
    ...financialHandlers,
    ...learningHandlers,
    ...communityHandlers,
    ...schedulingHandlers,
    ...analyticsHandlers,
    ...paymentHandlers,
    ...blockchainHandlers,
    ...exportDocsHandlers,
    ...emergencyHandlers,
    ...adminHandlers,
];
