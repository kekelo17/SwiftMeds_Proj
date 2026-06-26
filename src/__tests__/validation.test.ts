import {
 signUpClientSchema,
 signInSchema,
 reservationSchema
} from "@/lib/validations";

describe("User Registration",()=>{

test("accepts valid user information",()=>{

const user={
fullName:"John Doe",
email:"john@gmail.com",
phoneNumber:"677889900",
password:"password123"
};

const result =
signUpClientSchema.safeParse(user);

expect(result.success)
.toBe(true);

});

test("rejects invalid email",()=>{

const user={
fullName:"John Doe",
email:"wrongemail",
phoneNumber:"677889900",
password:"password123"
};

const result=
signUpClientSchema.safeParse(user);

expect(result.success)
.toBe(false);

});

});

describe("Authentication",()=>{

test("valid login credentials",()=>{

const data={
email:"user@gmail.com",
password:"12345678"
};

expect(
signInSchema.safeParse(data).success
)
.toBe(true);

});

});

describe("Reservation",()=>{

test("quantity must be between 1 and 50",()=>{

const reservation={
quantity:5,
phoneNumber:"677889900"
};

expect(
reservationSchema.safeParse(reservation).success
)
.toBe(true);

});

test("reject quantity above stock limit",()=>{

const reservation={
quantity:100,
phoneNumber:"677889900"
};

expect(
reservationSchema.safeParse(reservation).success
)
.toBe(false);

});

});