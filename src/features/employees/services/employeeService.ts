import api from '@/lib/http'

import type {
  EmployeeAddress,
  EmployeeCollectionResponse,
  EmployeeDetail,
  EmployeeEmergencyContact,
  EmployeeExportParams,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeFormAddressPayload,
  EmployeeFormEmergencyContactPayload,
  EmployeeFormPositionPayload,
  EmployeePositionListResponse,
  EmployeePositionHistoryItem,
  EmployeeProfilePhotoUploadResponse,
  EmployeeShowParams,
  EmployeeTerminatePayload,
  EmployeeUpsertPayload,
} from '../interface/employee.interface'

type EmployeeExportResponse = {
  blob: Blob
  filename: string
}

const DEFAULT_EXPORT_FILENAME = `employees-${new Date().toISOString().slice(0, 10)}.xlsx`

const getFilenameFromDisposition = (contentDisposition: string | undefined) => {
  if (!contentDisposition) {
    return DEFAULT_EXPORT_FILENAME
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)

  return filenameMatch?.[1] ?? DEFAULT_EXPORT_FILENAME
}

const serializeInclude = (include?: string[] | string) => {
  if (!include) {
    return undefined
  }

  return Array.isArray(include) ? include.join(',') : include
}

export const employeeService = {
  async getEmployees(params?: EmployeeListParams) {
    const { data } = await api.get<EmployeeListResponse>('/employees', {
      params: {
        ...params,
        include: serializeInclude(params?.include),
      },
    })

    return data
  },

  async getPositions() {
    const { data } = await api.get<EmployeePositionListResponse>('/positions')

    return data
  },

  async exportEmployeesExcel(params?: EmployeeExportParams) {
    const response = await api.get<Blob>('/employees/export/excel', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers['content-disposition']),
    } satisfies EmployeeExportResponse
  },

  async getEmployee(id: number, params?: EmployeeShowParams) {
    const { data } = await api.get<EmployeeDetail>(`/employees/${id}`, {
      params: {
        ...params,
        include: serializeInclude(params?.include),
      },
    })

    return data
  },

  async createEmployee(payload: EmployeeUpsertPayload) {
    const { data } = await api.post<EmployeeDetail>('/employees', payload)

    return data
  },

  async updateEmployee(id: number, payload: EmployeeUpsertPayload) {
    const { data } = await api.patch<EmployeeDetail>(`/employees/${id}`, payload)

    return data
  },

  async getEmployeeAddresses(id: number) {
    const { data } = await api.get<EmployeeCollectionResponse<EmployeeAddress>>(
      `/employees/${id}/addresses`,
    )

    return data
  },

  async createEmployeeAddress(id: number, payload: EmployeeFormAddressPayload) {
    const { data } = await api.post<EmployeeAddress>(`/employees/${id}/addresses`, payload)

    return data
  },

  async updateEmployeeAddress(id: number, addressId: number, payload: EmployeeFormAddressPayload) {
    const { data } = await api.put<EmployeeAddress>(
      `/employees/${id}/addresses/${addressId}`,
      payload,
    )

    return data
  },

  async deleteEmployeeAddress(id: number, addressId: number) {
    const response = await api.delete(`/employees/${id}/addresses/${addressId}`)

    return response.data
  },

  async getEmployeeEmergencyContacts(id: number) {
    const { data } = await api.get<EmployeeCollectionResponse<EmployeeEmergencyContact>>(
      `/employees/${id}/emergency-contacts`,
    )

    return data
  },

  async createEmployeeEmergencyContact(id: number, payload: EmployeeFormEmergencyContactPayload) {
    const { data } = await api.post<EmployeeEmergencyContact>(
      `/employees/${id}/emergency-contacts`,
      payload,
    )

    return data
  },

  async updateEmployeeEmergencyContact(
    id: number,
    contactId: number,
    payload: EmployeeFormEmergencyContactPayload,
  ) {
    const { data } = await api.put<EmployeeEmergencyContact>(
      `/employees/${id}/emergency-contacts/${contactId}`,
      payload,
    )

    return data
  },

  async deleteEmployeeEmergencyContact(id: number, contactId: number) {
    const response = await api.delete(`/employees/${id}/emergency-contacts/${contactId}`)

    return response.data
  },

  async getEmployeePositions(id: number) {
    const { data } = await api.get<EmployeeCollectionResponse<EmployeePositionHistoryItem>>(
      `/employees/${id}/positions`,
    )

    return data
  },

  async createEmployeePosition(id: number, payload: EmployeeFormPositionPayload) {
    const { data } = await api.post<EmployeePositionHistoryItem>(
      `/employees/${id}/positions`,
      payload,
    )

    return data
  },

  async updateEmployeePosition(
    id: number,
    employeePositionId: number,
    payload: EmployeeFormPositionPayload,
  ) {
    const { data } = await api.put<EmployeePositionHistoryItem>(
      `/employees/${id}/positions/${employeePositionId}`,
      payload,
    )

    return data
  },

  async deleteEmployeePosition(id: number, employeePositionId: number) {
    const response = await api.delete(`/employees/${id}/positions/${employeePositionId}`)

    return response.data
  },

  async deactivateEmployee(id: number) {
    const { data } = await api.post<EmployeeDetail>(`/employees/${id}/deactivate`, {})

    return data
  },

  async activateEmployee(id: number) {
    const { data } = await api.post<EmployeeDetail>(`/employees/${id}/activate`, {})

    return data
  },

  async terminateEmployee(id: number, payload?: EmployeeTerminatePayload) {
    const { data } = await api.post<EmployeeDetail>(`/employees/${id}/terminate`, payload ?? {})

    return data
  },

  async unterminateEmployee(id: number) {
    const { data } = await api.post<EmployeeDetail>(`/employees/${id}/unterminate`, {})

    return data
  },

  async restoreEmployee(id: number) {
    const { data } = await api.post<EmployeeDetail>(`/employees/${id}/restore`, {})

    return data
  },

  async uploadProfilePhoto(id: number, file: File) {
    const formData = new FormData()
    formData.append('profile_photo', file)

    const { data } = await api.post<EmployeeProfilePhotoUploadResponse>(
      `/employees/${id}/profile-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return data
  },
}
