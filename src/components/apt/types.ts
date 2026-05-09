export type Appointment = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  place: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled" | "not_confirmed";
  createdAt: string;
  updatedAt: string;
};

export type PendingTransfer = {
  appointmentIndex: number;
  fromDate: string;
  toDate: string;
};

export type AppointmentStatus = Appointment["status"];
