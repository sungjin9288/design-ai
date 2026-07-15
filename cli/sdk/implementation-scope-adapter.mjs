import {
  approveImplementationScope as approveContract,
  proposeImplementationScope as proposeContract,
} from "../lib/implementation-scope.mjs";
import { requireNonEmptyString, requireOptions } from "./validate.mjs";

export function proposeImplementationScope(intakeSource, requestSource, opts) {
  requireNonEmptyString(intakeSource, "intakeSource");
  requireNonEmptyString(requestSource, "requestSource");
  const options = requireOptions(opts, "proposeImplementationScope");
  return proposeContract(intakeSource, requestSource, {
    intakeRef: requireNonEmptyString(options.intakeRef, "intakeRef"),
    requestRef: requireNonEmptyString(options.requestRef, "requestRef"),
    consumer: requireNonEmptyString(options.consumer, "consumer"),
  });
}

export function approveImplementationScope(proposalSource, opts) {
  requireNonEmptyString(proposalSource, "proposalSource");
  const options = requireOptions(opts, "approveImplementationScope");
  if (options.confirmed !== true) {
    throw new TypeError("confirmed must be true");
  }
  return approveContract(proposalSource, {
    proposalRef: requireNonEmptyString(options.proposalRef, "proposalRef"),
    approver: requireNonEmptyString(options.approver, "approver"),
    approvalRef: requireNonEmptyString(options.approvalRef, "approvalRef"),
    approvedAt: requireNonEmptyString(options.approvedAt, "approvedAt"),
    confirmed: true,
  });
}
