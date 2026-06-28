import { users, newId } from '../db.js'

class UserDoc {
  constructor(data) {
    this._id = newId()
    this.name = data.name
    this.email = data.email
    this.password = data.password
    this.creditBalance = data.creditBalance ?? 5
  }
  async save() {
    users.set(this._id, this)
    return this
  }
}

const statics = {
  findOne: async ({ email }) => {
    for (const u of users.values()) {
      if (u.email === email) return u
    }
    return null
  },
  findById: async (id) => users.get(id) ?? null,
  findByIdAndUpdate: async (id, update) => {
    const u = users.get(id)
    if (u) Object.assign(u, update)
    return u
  },
}

function userModel(data) { return new UserDoc(data) }
Object.assign(userModel, statics)

export default userModel
