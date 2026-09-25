import { passwordSchema } from "@/lib/validations";

const DEFAULT_INITIAL_PASSWORD_ENV = "DEFAULT_INITIAL_PASSWORD";

export function getDefaultInitialPassword(): string {
	const password = process.env[DEFAULT_INITIAL_PASSWORD_ENV];

	if (!password) {
		throw new Error(`${DEFAULT_INITIAL_PASSWORD_ENV} is required to create users without an explicit password`);
	}

	const parsed = passwordSchema.safeParse(password);
	if (!parsed.success) {
		throw new Error(
			`${DEFAULT_INITIAL_PASSWORD_ENV} does not satisfy the password policy: ${parsed.error.issues[0]?.message ?? "invalid password"}`
		);
	}

	return parsed.data;
}
