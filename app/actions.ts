'use server';

export async function validateSolutionPassword(password: string): Promise<boolean> {
    // Simple check against the environment variable
    return password === process.env.SOLUTION_PASSWORD;
}
