import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/noc/user/list',
    method: 'get',
    params: query
  })
}

export function createUser(data) {
  return request({
    url: '/user/create',
    method: 'post',
    data
  })
}

export function readUser(data) {
  return request({
    url: '/user/detail',
    method: 'get',
    data
  })
}

export function deleteObj(data) {
  return request({
    url: '/user/delete',
    method: 'post',
    data
  })
}

export function freezeObj(data) {
  return request({
    url: '/user/freeze',
    method: 'post',
    data
  })
}

export function unfreezeObj(data) {
  return request({
    url: '/user/unfreeze',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data
  })
}
