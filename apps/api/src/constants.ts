export const APP_NAME = 'LockerHub'

const env = Object.assign(Object.create(null), process.env)

export const fromEnv = (name: string): string | undefined => env[name]
