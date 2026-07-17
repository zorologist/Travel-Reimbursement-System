import { describe, it, expect } from "vitest";
import { calculateSalary, SalaryCalculationInput } from "./calculateSalary";

describe("calculateSalary", () => {
  const defaultInput: SalaryCalculationInput = {
    jobLevel: "Level 1",
    accommodationType: "none",
    overnightCount: 0,
    isSameDayMission: false,
    sameDayVerifiedHours: 0,
    returnDayVerifiedHours: 0,
    transportationCost: 0,
    bonusAmount: 0,
    penaltyAmount: 0,
  };

  // ─── Every Job Level ───────────────────────────────────────────────────────

  describe("every job level daily rate", () => {
    const jobLevelsAndRates: Array<[SalaryCalculationInput["jobLevel"], number]> = [
      ["Chairman", 270],
      ["Deputy", 270],
      ["Advisor", 270],
      ["Expert", 270],
      ["Assistant", 240],
      ["Deputy Assistant", 240],
      ["General Manager", 200],
      ["Assistant General Manager", 200],
      ["Level 1", 140],
      ["Level 2", 110],
      ["Level 3", 60],
    ];

    jobLevelsAndRates.forEach(([jobLevel, expectedRate]) => {
      it(`${jobLevel} has daily rate of ${expectedRate} EGP`, () => {
        const result = calculateSalary({
          ...defaultInput,
          jobLevel,
          isSameDayMission: true,
          sameDayVerifiedHours: 7,
        });
        expect(result.dailyRate).toBe(expectedRate);
        expect(result.sameDayAmount).toBe(expectedRate * 0.5);
      });
    });
  });

  // ─── Same-Day Mission Rules ────────────────────────────────────────────────

  describe("same-day missions", () => {
    it("Level 1, same day, 6.99 hours -> 0 EGP (below 7 hours)", () => {
      const result = calculateSalary({
        ...defaultInput,
        isSameDayMission: true,
        sameDayVerifiedHours: 6.99,
      });
      expect(result.sameDayAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it("Level 1, same day, exactly 7 hours -> 70 EGP (50% of 140)", () => {
      const result = calculateSalary({
        ...defaultInput,
        isSameDayMission: true,
        sameDayVerifiedHours: 7,
      });
      expect(result.sameDayAmount).toBe(70);
      expect(result.totalAmount).toBe(70);
    });

    it("Level 1, same day, 8 hours -> 70 EGP (capped at 50%)", () => {
      const result = calculateSalary({
        ...defaultInput,
        isSameDayMission: true,
        sameDayVerifiedHours: 8,
      });
      expect(result.sameDayAmount).toBe(70);
      expect(result.totalAmount).toBe(70);
    });

    it("Level 3, same day, 7 hours -> 30 EGP (50% of 60)", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Level 3",
        isSameDayMission: true,
        sameDayVerifiedHours: 7,
      });
      expect(result.sameDayAmount).toBe(30);
      expect(result.totalAmount).toBe(30);
    });

    it("Chairman, same day, 7 hours -> 135 EGP (50% of 270)", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Chairman",
        isSameDayMission: true,
        sameDayVerifiedHours: 7,
      });
      expect(result.sameDayAmount).toBe(135);
      expect(result.totalAmount).toBe(135);
    });
  });

  // ─── Overnight Trips and Return Days ───────────────────────────────────────

  describe("overnight trips", () => {
    it("Level 1, two nights, no accommodation provided, 7-hour return day -> 322 EGP", () => {
      // (140 * 2 * 1.0) + (140 * 0.3) = 280 + 42 = 322
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 2,
        accommodationType: "none",
        returnDayVerifiedHours: 7,
      });
      expect(result.overnightAmount).toBe(280);
      expect(result.returnDayAmount).toBe(42);
      expect(result.totalAmount).toBe(322);
    });

    it("Level 1, two nights, room only, 7-hour return day -> 252 EGP", () => {
      // (140 * 2 * 0.75) + (140 * 0.3) = 210 + 42 = 252
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 2,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
      });
      expect(result.overnightAmount).toBe(210);
      expect(result.returnDayAmount).toBe(42);
      expect(result.totalAmount).toBe(252);
    });

    it("Level 1, two nights, room and food, 7-hour return day -> 182 EGP", () => {
      // (140 * 2 * 0.5) + (140 * 0.3) = 140 + 42 = 182
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 2,
        accommodationType: "room-and-food",
        returnDayVerifiedHours: 7,
      });
      expect(result.overnightAmount).toBe(140);
      expect(result.returnDayAmount).toBe(42);
      expect(result.totalAmount).toBe(182);
    });

    it("Level 1, two nights, room only, 6.99-hour return day -> 210 EGP (no return-day allowance)", () => {
      // (140 * 2 * 0.75) + 0 = 210
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 2,
        accommodationType: "room-only",
        returnDayVerifiedHours: 6.99,
      });
      expect(result.overnightAmount).toBe(210);
      expect(result.returnDayAmount).toBe(0);
      expect(result.totalAmount).toBe(210);
    });

    it("Level 2, one night, no accommodation, no return day hours -> 110 EGP", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Level 2",
        overnightCount: 1,
        accommodationType: "none",
        returnDayVerifiedHours: 0,
      });
      expect(result.overnightAmount).toBe(110);
      expect(result.returnDayAmount).toBe(0);
      expect(result.totalAmount).toBe(110);
    });

    it("General Manager, three nights, room-and-food, 8-hour return day -> 360 EGP", () => {
      // (200 * 3 * 0.5) + (200 * 0.3) = 300 + 60 = 360
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "General Manager",
        overnightCount: 3,
        accommodationType: "room-and-food",
        returnDayVerifiedHours: 8,
      });
      expect(result.overnightAmount).toBe(300);
      expect(result.returnDayAmount).toBe(60);
      expect(result.totalAmount).toBe(360);
    });
  });

  // ─── Accommodation Does Not Reduce Return-Day Amount ───────────────────────

  describe("accommodation does not reduce return-day amount", () => {
    it("return-day amount is always 30% of daily rate regardless of accommodation", () => {
      const accommodations: Array<SalaryCalculationInput["accommodationType"]> = [
        "none",
        "room-only",
        "room-and-food",
      ];

      accommodations.forEach((accommodationType) => {
        const result = calculateSalary({
          ...defaultInput,
          overnightCount: 1,
          accommodationType,
          returnDayVerifiedHours: 7,
        });
        // Return-day amount should always be 140 * 0.3 = 42 regardless of accommodation
        expect(result.returnDayAmount).toBe(42);
      });
    });
  });

  // ─── Same-Day and Overnight Pay Cannot Both Apply ──────────────────────────

  describe("mutual exclusivity of same-day and overnight", () => {
    it("confirms same-day and overnight pay cannot both apply", () => {
      const result = calculateSalary({
        ...defaultInput,
        isSameDayMission: true,
        sameDayVerifiedHours: 7,
        overnightCount: 2,
        returnDayVerifiedHours: 7,
      });
      expect(result.sameDayAmount).toBe(70);
      expect(result.overnightAmount).toBe(0);
      expect(result.returnDayAmount).toBe(0);
      expect(result.totalAmount).toBe(70);
    });
  });

  // ─── Transportation Cost Remaining Separate ────────────────────────────────

  describe("transportation cost", () => {
    it("transportation cost is added as a separate amount to total", () => {
      const result = calculateSalary({
        ...defaultInput,
        isSameDayMission: true,
        sameDayVerifiedHours: 7,
        transportationCost: 150,
      });
      expect(result.sameDayAmount).toBe(70);
      expect(result.transportationCost).toBe(150);
      expect(result.totalAmount).toBe(220);
    });

    it("transportation cost is separate from overnight calculation", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
        transportationCost: 200,
      });
      // (140 * 1 * 0.75) + (140 * 0.3) + 200 = 105 + 42 + 200 = 347
      expect(result.overnightAmount).toBe(105);
      expect(result.returnDayAmount).toBe(42);
      expect(result.transportationCost).toBe(200);
      expect(result.totalAmount).toBe(347);
    });
  });

  // ─── Positive Bonuses and Negative Penalties ───────────────────────────────

  describe("bonuses and penalties", () => {
    it("applies transportation, bonus, and penalty correctly (PDF example: 362 EGP)", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 2,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
        transportationCost: 100,
        bonusAmount: 20,
        penaltyAmount: 10,
      });
      expect(result.overnightAmount).toBe(210);
      expect(result.returnDayAmount).toBe(42);
      expect(result.transportationCost).toBe(100);
      expect(result.bonusAmount).toBe(20);
      expect(result.penaltyAmount).toBe(10);
      expect(result.totalAmount).toBe(362);
    });

    it("bonus increases total amount", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "none",
        bonusAmount: 50,
      });
      expect(result.totalAmount).toBe(190);
    });

    it("penalty decreases total amount", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "none",
        penaltyAmount: 30,
      });
      expect(result.totalAmount).toBe(110);
    });
  });

  // ─── Invalid Input Rejection ───────────────────────────────────────────────

  describe("invalid input rejection", () => {
    it("rejects negative overnightCount", () => {
      expect(() => calculateSalary({ ...defaultInput, overnightCount: -1 })).toThrow(
        "overnightCount cannot be negative"
      );
    });

    it("rejects negative sameDayVerifiedHours", () => {
      expect(() => calculateSalary({ ...defaultInput, sameDayVerifiedHours: -1 })).toThrow(
        "sameDayVerifiedHours cannot be negative"
      );
    });

    it("rejects negative returnDayVerifiedHours", () => {
      expect(() => calculateSalary({ ...defaultInput, returnDayVerifiedHours: -1 })).toThrow(
        "returnDayVerifiedHours cannot be negative"
      );
    });

    it("rejects negative transportationCost", () => {
      expect(() => calculateSalary({ ...defaultInput, transportationCost: -1 })).toThrow(
        "transportationCost cannot be negative"
      );
    });

    it("rejects negative bonusAmount", () => {
      expect(() => calculateSalary({ ...defaultInput, bonusAmount: -1 })).toThrow(
        "bonusAmount cannot be negative"
      );
    });

    it("rejects negative penaltyAmount", () => {
      expect(() => calculateSalary({ ...defaultInput, penaltyAmount: -1 })).toThrow(
        "penaltyAmount cannot be negative"
      );
    });
  });

  // ─── Money Rounding ────────────────────────────────────────────────────────

  describe("money rounding to two decimal places", () => {
    it("rounds overnight amount with room-only factor", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Chairman",
        overnightCount: 1,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
      });
      expect(result.overnightAmount).toBe(202.5);
      expect(result.returnDayAmount).toBe(81);
      expect(result.totalAmount).toBe(283.5);
    });

    it("rounds values that produce repeating decimals", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Level 3",
        overnightCount: 3,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
        transportationCost: 33.333,
      });
      expect(result.overnightAmount).toBe(135);
      expect(result.returnDayAmount).toBe(18);
      expect(result.transportationCost).toBe(33.33);
      expect(result.totalAmount).toBe(186.33);
    });

    it("all returned monetary values have at most two decimal places", () => {
      const result = calculateSalary({
        ...defaultInput,
        jobLevel: "Level 2",
        overnightCount: 1,
        accommodationType: "room-only",
        returnDayVerifiedHours: 7,
        transportationCost: 99.999,
        bonusAmount: 10.005,
        penaltyAmount: 5.555,
      });
      const checkTwoDecimals = (val: number) => {
        const str = val.toString();
        const parts = str.split(".");
        if (parts.length === 2) {
          expect(parts[1].length).toBeLessThanOrEqual(2);
        }
      };
      checkTwoDecimals(result.dailyRate);
      checkTwoDecimals(result.overnightAmount);
      checkTwoDecimals(result.sameDayAmount);
      checkTwoDecimals(result.returnDayAmount);
      checkTwoDecimals(result.transportationCost);
      checkTwoDecimals(result.bonusAmount);
      checkTwoDecimals(result.penaltyAmount);
      checkTwoDecimals(result.totalAmount);
    });
  });

  // ─── Every Accommodation Option ────────────────────────────────────────────

  describe("every accommodation option", () => {
    it("none: full allowance (factor 1.0)", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "none",
      });
      expect(result.overnightAmount).toBe(140);
    });

    it("room-only: 75% allowance (factor 0.75)", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "room-only",
      });
      expect(result.overnightAmount).toBe(105);
    });

    it("room-and-food: 50% allowance (factor 0.5)", () => {
      const result = calculateSalary({
        ...defaultInput,
        overnightCount: 1,
        accommodationType: "room-and-food",
      });
      expect(result.overnightAmount).toBe(70);
    });
  });
});
