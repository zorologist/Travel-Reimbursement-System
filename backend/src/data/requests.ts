import { TravelRequest } from "../../../shared/types/TravelRequest.js";

function buildRequest(
  id: string,
  employeeId: string,
  stage: string,
  city: string,
  dailyRate: number
) {
  return {
    id,
    employeeId,
    stage,
    destinationCity: city,
    departureAt: "2026-08-01T08:00:00.000Z",
    returnAt: "2026-08-03T18:00:00.000Z",
    accommodationType: "room-and-food",
    transportationMethod: "Company car",
    verifiedDepartureAt: null,
    verifiedReturnAt: null,
    verifiedSameDayHours: 0,
    verifiedReturnDayHours: 0,
    transportationCost: 0,
    bonusAmount: 0,
    penaltyAmount: 0,
    salaryPreview: {
      dailyRate,
      overnightCount: 2,
      overnightAmount: dailyRate * 2,
      sameDayAmount: 0,
      returnDayAmount: 0,
      transportationCost: 0,
      bonusAmount: 0,
      penaltyAmount: 0,
      totalAmount: dailyRate * 2,
    },
    finalSalary: null,
    cancellationReason: null,
    createdAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-07-28T09:00:00.000Z",
    auditEvents: [],
  };
}

export const developmentRequests = [
  buildRequest("r1", "u1", "manager-review", "Alexandria", 500),
  buildRequest("r2", "u2", "pr-review", "Aswan", 450),
  buildRequest("r3", "u4", "salary-finalization", "Luxor", 600),
  buildRequest("r4", "u6", "completed", "Sharm El Sheikh", 550),
];