import { transactions, newId } from '../db.js'

const transactionModel = {
  create: async (data) => {
    const tx = { _id: newId(), payment: false, ...data }
    transactions.set(tx._id, tx)
    return tx
  },
  findById: async (id) => transactions.get(id) ?? null,
  findByIdAndUpdate: async (id, update) => {
    const tx = transactions.get(id)
    if (tx) Object.assign(tx, update)
    return tx
  },
}

export default transactionModel
