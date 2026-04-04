export const setCookie = (name: string, value: string, maxAge?: number) => {
  const cookie = [`${name}=${value}`, 'path=/']

  if (typeof maxAge === 'number' && Number.isFinite(maxAge) && maxAge > 0) {
    cookie.push(`max-age=${maxAge}`)
  }

  document.cookie = cookie.join('; ')
}

export const getCookie = (name: string) => {
  const cookies = document.cookie.split('; ')
  const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`))

  return targetCookie ? targetCookie.slice(name.length + 1) : null
}

export const removeCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`
}
