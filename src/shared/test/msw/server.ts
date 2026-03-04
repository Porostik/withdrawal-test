import { setupServer } from "msw/node";
import {
  successHandler,
  loginHandler,
  getMeHandler,
  getBalancesHandler,
  listWithdrawalsHandler,
} from "./handlers";

export const server = setupServer(
  loginHandler,
  getMeHandler,
  getBalancesHandler,
  listWithdrawalsHandler,
  successHandler
);
