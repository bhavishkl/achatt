export type TimeSlot = "morning" | "evening";

export type Appointment = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  place: string;
  date: string;
  timeSlot: TimeSlot;
  status: "pending" | "confirmed" | "cancelled" | "not_confirmed";
  createdAt: string;
  updatedAt: string;
};

export type PendingTransfer = {
  appointmentIndex: number;
  fromDate: string;
  fromTimeSlot: TimeSlot;
  toDate: string;
  toTimeSlot: TimeSlot;
};

export type AppointmentStatus = Appointment["status"];
