/**
 * Guest Experience Components Index
 * ===================================
 * Central exports for all guest experience related components
 *
 * Components included:
 * - GuestExperience: Shows empty vault message and sign-in prompt
 * - StorageModeIndicator: Displays current storage mode (Cloud/Guest)
 * - LoginRequiredDialog: Shows modal when guests try to perform actions
 */

export { GuestExperience } from "./GuestExperience";
export { LoginRequiredDialog, useLoginRequired } from "./LoginRequiredDialog";
export { StorageModeIndicator } from "./StorageModeIndicator";

export type { GuestExperienceProps } from "./GuestExperience";
export type { LoginRequiredDialogProps } from "./LoginRequiredDialog";
export type { StorageModeIndicatorProps } from "./StorageModeIndicator";
