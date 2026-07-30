export interface DevelopmentCredential {
  employeeNumber: string;
  passwordHash: string;
}

/** Fictional development credentials. Only slow bcrypt hashes are stored. */
export const developmentCredentials: readonly DevelopmentCredential[] = [
  { employeeNumber: "DEV001", passwordHash: "$2b$12$5nVvaGL4iazMeLXpWoIlrOdBdur2Ouog7z44Gfc2Yhws5E4GMwn9." },
  { employeeNumber: "DEV002", passwordHash: "$2b$12$5nVvaGL4iazMeLXpWoIlrOdBdur2Ouog7z44Gfc2Yhws5E4GMwn9." },
  { employeeNumber: "DEV003", passwordHash: "$2b$12$5nVvaGL4iazMeLXpWoIlrOdBdur2Ouog7z44Gfc2Yhws5E4GMwn9." },
  { employeeNumber: "DEV004", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV005", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV006", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV007", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV008", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV009", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
  { employeeNumber: "DEV010", passwordHash: "$2b$12$.AfLw/Xu5ohcmDZAesnZ3.B7xgZfUDA/roomXTbZgkj0BGcxrKyF2" },
];
