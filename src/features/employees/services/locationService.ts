import api from '@/lib/http'

import type {
  EmployeeCommune,
  EmployeeDistrict,
  EmployeeLocationListResponse,
  EmployeeProvince,
  EmployeeVillage,
} from '../interface/employee.interface'

type SearchParams = {
  search?: string
}

type DistrictParams = SearchParams & {
  province_id?: number
}

type CommuneParams = SearchParams & {
  district_id?: number
}

type VillageParams = SearchParams & {
  commune_id?: number
}

export const locationService = {
  async getProvinces(params?: SearchParams) {
    const { data } = await api.get<EmployeeLocationListResponse<EmployeeProvince>>(
      '/locations/provinces',
      { params },
    )

    return data
  },

  async getDistricts(params?: DistrictParams) {
    const { data } = await api.get<EmployeeLocationListResponse<EmployeeDistrict>>(
      '/locations/districts',
      { params },
    )

    return data
  },

  async getCommunes(params?: CommuneParams) {
    const { data } = await api.get<EmployeeLocationListResponse<EmployeeCommune>>(
      '/locations/communes',
      { params },
    )

    return data
  },

  async getVillages(params?: VillageParams) {
    const { data } = await api.get<EmployeeLocationListResponse<EmployeeVillage>>(
      '/locations/villages',
      { params },
    )

    return data
  },
}
