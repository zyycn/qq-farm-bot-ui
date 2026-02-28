import api from '../request'

export function fetchFriends() {
  return api.get('/api/friends')
}

export function fetchBlacklist() {
  return api.get('/api/friend-blacklist')
}

export function toggleBlacklist(gid: number) {
  return api.post('/api/friend-blacklist/toggle', { gid })
}

export function fetchFriendLands(friendId: string) {
  return api.get(`/api/friend/${friendId}/lands`)
}

export function operateFriend(friendId: string, opType: string) {
  return api.post(`/api/friend/${friendId}/op`, { opType })
}
