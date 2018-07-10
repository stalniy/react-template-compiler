import { parseModel } from '../../src/directives/model'

describe('parseModel', () => {
  it('returns `exp` and `tokens` array which contains a single `exp` value', () => {
    const res = parseModel('value')

    expect(res.exp).toBe('value')
    expect(res.tokens).toEqual(['value'])
  })

  describe('`exp` contains everything except last token', () => {
    it('is true for `user.name`-like', () => {
      const res = parseModel('user.name')
      expect(res.exp).toBe('user')
    })

    it('is true for `user[name]`-like', () => {
      const res = parseModel('user[name]')
      expect(res.exp).toBe('user')
    })

    it('is true for `user.profile[name]`-like', () => {
      const res = parseModel('user.profile[name]')
      expect(res.exp).toBe('user.profile')
    })

    it('is true for `user[key].name`-like', () => {
      const res = parseModel('user[key].name')
      expect(res.exp).toBe('user[key]')
    })

    it('is true for `user[key][name]`-like', () => {
      const res = parseModel('user[key][name]')
      expect(res.exp).toBe('user[key]')
    })
  })

  describe('`tokens` contains property names and dynamic vars', () => {
    it('is true for `user.name`-like', () => {
      const res = parseModel('user.name')
      expect(res.tokens).toEqual(['"user"', '"name"'])
    })

    it('is true for `user[name]`-like', () => {
      const res = parseModel('user[name]')
      expect(res.tokens).toEqual(['"user"', 'name'])
    })

    it('is true for `user.profile[name]`-like', () => {
      const res = parseModel('user.profile[name]')
      expect(res.tokens).toEqual(['"user"', '"profile"', 'name'])
    })

    it('is true for `user[key].name`-like', () => {
      const res = parseModel('user[key].name')
      expect(res.tokens).toEqual(['"user"', 'key', '"name"'])
    })

    it('is true for `user[key][name]`-like', () => {
      const res = parseModel('user[key][name]')
      expect(res.tokens).toEqual(['"user"', 'key', 'name'])
    })
  })
})
