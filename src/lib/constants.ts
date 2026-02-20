export const DEPARTMENTS = [
    "Human Resources",
    "WARD",
    "OPD",
    "DUTY DOCTOR",
    "Sales",
    "Operations",
    "IT",
    "Legal",
    "Customer Support",
    "Administration",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
