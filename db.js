import crypto from 'crypto'

export const users = new Map()
export const transactions = new Map()
export const newId = () => crypto.randomUUID()
