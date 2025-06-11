import tourService from './tourService';
import userService from './userService';
import bookingService from './bookingService';
import paymentService from './paymentService';
import agentService from './agentService';
import customerServiceApi from './customerServiceApi';
import websocketService from './websocketService';
import { api, calculateDiscount, calculateTourDiscount } from './api';

export {
  tourService,
  userService,
  bookingService,
  paymentService,
  agentService,
  customerServiceApi,
  websocketService,
  api,
  calculateDiscount,
  calculateTourDiscount
};

export default {
  tourService,
  userService,
  bookingService,
  paymentService,
  agentService,
  customerServiceApi,
  websocketService,
  api
}; 