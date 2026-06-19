const mergeHeaders = (headers: HeadersInit | undefined, extra: HeadersInit): HeadersInit => {
    const merged = new Headers(headers)
    new Headers(extra).forEach((value, key) => merged.set(key, value))
    return merged
}

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> =>
    fetch(url, init)
        .then(async response => {
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message)
            }
            return response
        })
        .then(response => response.json())
        .then(data => data as T)

const sendData =
    (method: string) =>
    <T, U>(url: string, data?: T, init?: RequestInit): Promise<U> =>
        fetchJson(url, {
            ...init,
            method,
            headers: mergeHeaders(init?.headers, {
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(data),
        })

export const postJson = sendData('POST')
export const patchJson = sendData('PATCH')
export const putJson = sendData('PUT')

export const postNoContent = async <T>(url: string, data?: T, init?: RequestInit): Promise<void> => {
    const response = await fetch(url, {
        ...init,
        method: 'POST',
        headers: mergeHeaders(init?.headers, {
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
    }
}

export const putNoContent = async <T>(url: string, data?: T, init?: RequestInit): Promise<void> => {
    const response = await fetch(url, {
        ...init,
        method: 'PUT',
        headers: mergeHeaders(init?.headers, {
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(data),
    })
    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
    }
}

export const callDelete = async (url: string, init?: RequestInit) =>
    fetch(url, { ...init, method: 'DELETE' }).then(async response => {
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message)
        }
        return response
    })
