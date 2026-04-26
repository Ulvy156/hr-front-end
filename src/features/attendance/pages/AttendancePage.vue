<script setup lang="ts">
import axios from "axios";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Clock3,
  ClockAlert,
  FileClock,
  Hourglass,
  NotebookTabs,
  PencilLine,
  Timer,
  UserX,
  Users,
} from "lucide-vue-next";

import BaseButton from "@/components/ui/BaseButton.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseDatePicker from "@/components/ui/BaseDatePicker.vue";
import BaseDropdown, { type BaseDropdownOption } from "@/components/ui/BaseDropdown.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSpinner from "@/components/ui/BaseSpinner.vue";
import DashboardSummaryCards, {
  type DashboardSummaryCardItem,
} from "@/features/dashboard/components/DashboardSummaryCards.vue";
import { formatDateTime12h, formatTime12h } from "@/utils/time";

import AttendanceDepartmentSummary from "../components/AttendanceDepartmentSummary.vue";
import AttendanceCorrectionRequestModal from "../components/AttendanceCorrectionRequestModal.vue";
import AttendanceCorrectionRequests from "../components/AttendanceCorrectionRequests.vue";
import AttendanceCorrectionReviewModal from "../components/AttendanceCorrectionReviewModal.vue";
import AttendanceEmployeeActions from "../components/AttendanceEmployeeActions.vue";
import AttendanceMissingRequestModal from "../components/AttendanceMissingRequestModal.vue";
import AttendanceOutageRecoveryPanel from "../components/AttendanceOutageRecoveryPanel.vue";
import AttendancePlaceholderSection from "../components/AttendancePlaceholderSection.vue";
import AttendanceRecordsTable from "../components/AttendanceRecordsTable.vue";
import AttendanceStatusBadge from "../components/AttendanceStatusBadge.vue";
import { useAttendance } from "../composable/useAttendance";
import type { CorrectionRequest } from "../interface/attendance.interface";

type AttendanceRequestErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const {
  attendanceList,
  applyOutageRecovery,
  checkIn,
  checkOut,
  canAccessAttendanceWorkspace,
  canExportAttendance,
  canManageAttendance,
  canRequestAttendanceCorrection,
  canRequestMissingAttendance,
  canUseSelfAttendanceActions,
  canViewAttendanceAudit,
  canViewAttendanceRecords,
  canViewOrganizationAttendanceSummary,
  canViewSelfAttendanceHistory,
  canViewSelfAttendanceSummary,
  correctionRequests,
  employeeAttendanceHistory,
  employeeData,
  error,
  fetchAttendanceList,
  fetchCorrectionRequests,
  fetchEmployeeAttendance,
  fetchEmployeeAttendanceHistory,
  fetchEmployeeTodayAttendance,
  fetchOutageRecoveryPreview,
  fetchOrganizationAttendance,
  exportExcel,
  isLoading,
  isOutageRecoveryApplying,
  isOutageRecoveryLoading,
  lastUpdated,
  outageRecoveryError,
  outageRecoveryPreview,
  organizationData,
  reviewCorrectionRequest,
  submitCorrectionRequest,
  submitMissingAttendanceRequest,
} = useAttendance();

const router = useRouter();
const selectedMonth = ref(getCurrentMonth());
const selectedDepartmentId = ref<string | number | undefined>(undefined);
const statusFilter = ref("");
const employeeIdFilter = ref("");
const hrManagementTab = ref("records");
const attendanceListPage = ref(1);
const correctionRequestsPage = ref(1);
const outageRecoveryDate = ref(getTodayDate());
const outageRecoverySearch = ref("");
const outageRecoveryDepartmentId = ref<string | number | null>(null);
const outageRecoveryPerPage = ref(10);
const outageRecoveryPage = ref(1);
const outageRecoveryMode = ref<"full_day" | "morning" | "evening">("full_day");
const outageRecoveryCheckInAt = ref<Date | null>(null);
const outageRecoveryCheckOutAt = ref<Date | null>(null);
const selectedOutageRecoveryEmployeeIds = ref<number[]>([]);
const outageRecoveryNotes = ref("");
const selfServiceActionLoading = ref(false);
const selfServiceActionError = ref("");
const selfServiceActionSuccess = ref("");
const selfServiceRequestLoading = ref(false);
const isExportingExcel = ref(false);
const isCorrectionRequestModalOpen = ref(false);
const isMissingRequestModalOpen = ref(false);
const isCorrectionReviewModalOpen = ref(false);
const isCorrectionReviewSubmitting = ref(false);
const correctionRequestDate = ref<string | null>(null);
const correctionRequestAttendanceOptions = ref<
  Array<{
    requestDate: string;
  }>
>([]);
const selectedCorrectionRequest = ref<CorrectionRequest | null>(null);

const hasData = computed(() => {
  return (
    employeeData.value !== null ||
    organizationData.value !== null ||
    attendanceList.value !== null ||
    correctionRequests.value !== null ||
    outageRecoveryPreview.value !== null
  );
});

const formattedLastUpdated = computed(() => {
  if (!lastUpdated.value) return "Never";

  return formatDateTime12h(lastUpdated.value);
});

const employeeIdentity = computed(() => employeeData.value?.employee ?? null);
const employeeToday = computed(() => employeeData.value?.today ?? null);
const employeeWeek = computed(() => employeeData.value?.thisWeek ?? null);
const employeeMonth = computed(() => employeeData.value?.thisMonth ?? null);
const canOpenCorrectionRequest = computed(() => {
  return canRequestAttendanceCorrection.value && canViewSelfAttendanceHistory.value;
});
const canOpenMissingAttendanceRequest = computed(() => {
  return canRequestMissingAttendance.value && canViewSelfAttendanceHistory.value;
});
const hasOrganizationAttendanceAccess = computed(() => {
  return (
    canViewOrganizationAttendanceSummary.value ||
    canViewAttendanceRecords.value ||
    canManageAttendance.value ||
    canViewAttendanceAudit.value
  );
});
const canShowSelfActions = computed(() => {
  return (
    canUseSelfAttendanceActions.value ||
    canOpenCorrectionRequest.value ||
    canOpenMissingAttendanceRequest.value
  );
});
const canShowSelfAttendanceHistory = computed(() => {
  return canViewSelfAttendanceHistory.value && employeeAttendanceHistory.value !== null;
});
const canShowSelfAttendanceSummary = computed(() => {
  return canViewSelfAttendanceSummary.value && employeeData.value !== null;
});
const canShowAttendanceToolbar = computed(() => {
  return (
    canViewOrganizationAttendanceSummary.value ||
    canViewAttendanceRecords.value ||
    canManageAttendance.value ||
    canExportAttendance.value
  );
});
const canShowAttendanceManagement = computed(() => {
  return (
    canViewOrganizationAttendanceSummary.value ||
    canViewAttendanceRecords.value ||
    canManageAttendance.value
  );
});
const availableManagementTabs = computed(() => {
  const tabs: string[] = [];

  if (canViewOrganizationAttendanceSummary.value) {
    tabs.push("department-summary");
  }

  if (canViewAttendanceRecords.value) {
    tabs.push("records", "correction-requests");
  }

  if (canManageAttendance.value) {
    tabs.push("outage-recovery");
  }

  return tabs;
});

const departmentFilterOptions = computed<BaseDropdownOption[]>(() =>
  (organizationData.value?.byDepartment ?? []).map((department) => ({
    label: department.departmentName,
    value: department.departmentId,
  })),
);

const statusFilterOptions: BaseDropdownOption[] = [
  { label: "Present", value: "present" },
  { label: "Late", value: "late" },
  { label: "Absent", value: "absent" },
  { label: "Corrected", value: "corrected" },
];

const organizationPrimaryCards = computed<DashboardSummaryCardItem[]>(() => {
  const totals = organizationData.value?.totals;

  if (!totals) return [];

  return [
    {
      key: "totalRecords",
      label: "Total Records",
      value: formatCount(totals.totalRecords),
      icon: NotebookTabs,
    },
    {
      key: "completedRecords",
      label: "Completed Records",
      value: formatCount(totals.completedRecords),
      icon: BadgeCheck,
    },
    {
      key: "lateRecords",
      label: "Late Records",
      value: formatCount(totals.lateRecords),
      icon: ClockAlert,
    },
    {
      key: "correctedRecords",
      label: "Corrected Records",
      value: formatCount(totals.correctedRecords),
      icon: PencilLine,
    },
  ];
});

const organizationSecondaryCards = computed<DashboardSummaryCardItem[]>(() => {
  const totals = organizationData.value?.totals;

  if (!totals) return [];

  return [
    {
      key: "absentRecords",
      label: "Absent Records",
      value: formatCount(totals.absentRecords),
      icon: UserX,
    },
    {
      key: "totalWorkedMinutes",
      label: "Total Worked Minutes",
      value: formatMinutes(totals.totalWorkedMinutes),
      helper: `${formatCount(totals.totalWorkedMinutes)} minutes`,
      icon: Timer,
    },
    {
      key: "averageWorkedMinutes",
      label: "Average Worked Minutes",
      value: formatMinutes(totals.averageWorkedMinutes),
      helper: `${formatCount(totals.averageWorkedMinutes)} minutes`,
      icon: Hourglass,
    },
    {
      key: "pendingCorrectionRequestsCount",
      label: "Pending Correction Requests",
      value: formatCount(totals.pendingCorrectionRequestsCount),
      icon: FileClock,
    },
  ];
});

const employeeWeekCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeWeek.value) return [];

  return [
    {
      key: "presentDays",
      label: "Present Days",
      value: formatCount(employeeWeek.value.presentDays),
      icon: CalendarDays,
    },
    {
      key: "lateCount",
      label: "Late Count",
      value: formatCount(employeeWeek.value.lateCount),
      icon: ClockAlert,
    },
    {
      key: "absentCount",
      label: "Absent Count",
      value: formatCount(employeeWeek.value.absentCount),
      icon: AlertCircle,
    },
    {
      key: "workedMinutes",
      label: "Worked Minutes",
      value: formatMinutes(employeeWeek.value.workedMinutes),
      helper: `${formatCount(employeeWeek.value.workedMinutes)} minutes`,
      icon: Timer,
    },
  ];
});

const employeeMonthCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeMonth.value) return [];

  return [
    {
      key: "presentDays",
      label: "Present Days",
      value: formatCount(employeeMonth.value.presentDays),
      icon: CalendarDays,
    },
    {
      key: "lateCount",
      label: "Late Count",
      value: formatCount(employeeMonth.value.lateCount),
      icon: ClockAlert,
    },
    {
      key: "absentCount",
      label: "Absent Count",
      value: formatCount(employeeMonth.value.absentCount),
      icon: AlertCircle,
    },
    {
      key: "workedMinutes",
      label: "Worked Minutes",
      value: formatMinutes(employeeMonth.value.workedMinutes),
      helper: `${formatCount(employeeMonth.value.workedMinutes)} minutes`,
      icon: Timer,
    },
    {
      key: "pendingCorrectionRequests",
      label: "Pending Correction Requests",
      value: formatCount(employeeMonth.value.pendingCorrectionRequests),
      icon: FileClock,
    },
  ];
});

const buildOrganizationSummaryParams = () => ({
  month: selectedMonth.value,
  department_id:
    canViewOrganizationAttendanceSummary.value &&
    selectedDepartmentId.value !== undefined
      ? Number(selectedDepartmentId.value)
      : undefined,
});

const todayDetails = computed(() => {
  const today = employeeToday.value;

  if (!today) return [];

  return [
    {
      key: "attendanceDate",
      label: "Attendance Date",
      value: formatDate(today.attendanceDate),
    },
    {
      key: "checkInTime",
      label: "Check-in Time",
      value: formatTime(today.checkInTime),
    },
    {
      key: "checkOutTime",
      label: "Check-out Time",
      value: formatTime(today.checkOutTime),
    },
    {
      key: "workedMinutes",
      label: "Worked Minutes",
      value: formatMinutes(today.workedMinutes),
    },
    {
      key: "lateMinutes",
      label: "Late Minutes",
      value: formatMinutes(today.lateMinutes),
    },
    {
      key: "earlyLeaveMinutes",
      label: "Early Leave Minutes",
      value: formatMinutes(today.earlyLeaveMinutes),
    },
  ];
});

const loadAttendance = async () => {
  if (!canAccessAttendanceWorkspace.value) {
    return;
  }

  try {
    const tasks: Array<Promise<unknown>> = [];

    if (canViewOrganizationAttendanceSummary.value) {
      tasks.push(fetchOrganizationAttendance(buildOrganizationSummaryParams()));
    }

    if (canViewSelfAttendanceSummary.value) {
      tasks.push(fetchEmployeeAttendance().catch(() => undefined));
    }

    if (canViewSelfAttendanceHistory.value) {
      tasks.push(fetchEmployeeAttendanceHistory({ per_page: 100 }).catch(() => undefined));
    }

    if (canViewAttendanceRecords.value) {
      tasks.push(fetchAttendanceList(buildAttendanceListParams(attendanceListPage.value)));
      tasks.push(fetchCorrectionRequests(buildCorrectionRequestParams(correctionRequestsPage.value)));
    }

    if (canManageAttendance.value) {
      tasks.push(
        loadOutageRecoveryPreview({
          resetSelection: true,
          resetNotes: true,
          resetTimes: true,
        }).catch(() => undefined),
      );
    }

    await Promise.all(tasks);
  } catch {
    // Error state is handled by the attendance store.
  }
};

const refreshSelfServiceAttendance = async () => {
  if (canViewSelfAttendanceSummary.value) {
    await fetchEmployeeAttendance().catch(() => undefined);
  }

  if (canViewSelfAttendanceHistory.value) {
    await fetchEmployeeAttendanceHistory({ per_page: 100 }).catch(() => undefined);
  }

  if (canViewOrganizationAttendanceSummary.value) {
    await fetchOrganizationAttendance(buildOrganizationSummaryParams()).catch(() => undefined);
  }

  if (canViewAttendanceRecords.value) {
    await fetchCorrectionRequests(buildCorrectionRequestParams(correctionRequestsPage.value)).catch(() => undefined);
  }
};

const handleSelfServiceAction = async () => {
  if (!canUseSelfAttendanceActions.value) {
    return;
  }

  const nextAction = employeeToday.value?.nextAction;

  if (nextAction !== "check_in" && nextAction !== "check_out") {
    selfServiceActionError.value = "Attendance action is not available right now.";
    selfServiceActionSuccess.value = "";
    return;
  }

  selfServiceActionLoading.value = true;
  selfServiceActionError.value = "";
  selfServiceActionSuccess.value = "";

  try {
    const response = nextAction === "check_in" ? await checkIn() : await checkOut();

    selfServiceActionSuccess.value = response.message;
    await fetchEmployeeTodayAttendance().catch(() => undefined);
    await refreshSelfServiceAttendance();
  } catch (err) {
    selfServiceActionError.value = getAttendanceRequestErrorMessage(err);
  } finally {
    selfServiceActionLoading.value = false;
  }
};

const handleOpenScanFlow = async () => {
  if (!canUseSelfAttendanceActions.value) {
    return;
  }

  await router.push({ name: "attendance-scan" });
};

const handleOpenCorrectionRequest = async () => {
  if (!canOpenCorrectionRequest.value) {
    ElMessage.warning("Unable to load attendance history for a correction request right now.");
    return;
  }

  selfServiceRequestLoading.value = true;

  try {
    const history = await fetchEmployeeAttendanceHistory({ per_page: 100 });
    const eligibleRecords = history.data.filter(
      (record) =>
        record.correctionStatus !== "pending" && record.correctionStatus !== "approved",
    );

    if (eligibleRecords.length === 0) {
      ElMessage.warning(
        history.data.length === 0
          ? "No attendance records are available for a correction request yet."
          : "There are no attendance records available for a new correction request right now.",
      );
      return;
    }

    correctionRequestAttendanceOptions.value = eligibleRecords.map((record) => ({
      requestDate: record.attendanceDate,
    }));
    correctionRequestDate.value =
      eligibleRecords.find((record) => record.attendanceDate === employeeToday.value?.attendanceDate)
        ?.attendanceDate ?? eligibleRecords[0]?.attendanceDate ?? null;
    isCorrectionRequestModalOpen.value = true;
  } catch (err) {
    ElMessage.error(getAttendanceRequestErrorMessage(err));
  } finally {
    selfServiceRequestLoading.value = false;
  }
};

const handleOpenMissingAttendanceRequest = async () => {
  if (!canOpenMissingAttendanceRequest.value) {
    ElMessage.warning("Missing attendance requests are not available right now.");
    return;
  }

  await fetchEmployeeAttendanceHistory({ per_page: 100 }).catch(() => undefined);
  isMissingRequestModalOpen.value = true;
};

const handleSubmitCorrectionRequest = async (payload: {
  request_date: string;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  reason: string;
}) => {
  if (!canRequestAttendanceCorrection.value) {
    ElMessage.error("You do not have permission to submit a correction request.");
    return;
  }

  if (!payload.request_date) {
    ElMessage.error("Request date is required.");
    return;
  }

  selfServiceRequestLoading.value = true;

  try {
    const response = await submitCorrectionRequest({
      request_date: payload.request_date,
      requested_check_in_time: payload.requested_check_in_time ?? null,
      requested_check_out_time: payload.requested_check_out_time ?? null,
      reason: payload.reason,
    });

    ElMessage.success(response.message);
    isCorrectionRequestModalOpen.value = false;
    correctionRequestDate.value = null;
    correctionRequestAttendanceOptions.value = [];
    await refreshSelfServiceAttendance();
  } catch (err) {
    ElMessage.error(getAttendanceRequestErrorMessage(err));
  } finally {
    selfServiceRequestLoading.value = false;
  }
};

const handleSubmitMissingAttendanceRequest = async (payload: {
  request_date: string;
  requested_check_in_time?: string | null;
  requested_check_out_time?: string | null;
  reason: string;
}) => {
  if (!canRequestMissingAttendance.value) {
    ElMessage.error("You do not have permission to submit a missing attendance request.");
    return;
  }

  selfServiceRequestLoading.value = true;

  try {
    const response = await submitMissingAttendanceRequest({
      request_date: payload.request_date,
      requested_check_in_time: payload.requested_check_in_time ?? null,
      requested_check_out_time: payload.requested_check_out_time ?? null,
      reason: payload.reason,
    });

    ElMessage.success(response.message);
    isMissingRequestModalOpen.value = false;
  } catch (err) {
    ElMessage.error(getAttendanceRequestErrorMessage(err));
  } finally {
    selfServiceRequestLoading.value = false;
  }
};

const closeCorrectionRequestModal = () => {
  isCorrectionRequestModalOpen.value = false;
  correctionRequestDate.value = null;
  correctionRequestAttendanceOptions.value = [];
};

const closeMissingRequestModal = () => {
  isMissingRequestModalOpen.value = false;
};

const handleOpenCorrectionReview = (request: CorrectionRequest) => {
  if (!canManageAttendance.value) {
    return;
  }

  selectedCorrectionRequest.value = request;
  isCorrectionReviewModalOpen.value = true;
};

const closeCorrectionReviewModal = () => {
  isCorrectionReviewModalOpen.value = false;
  selectedCorrectionRequest.value = null;
};

const handleSubmitCorrectionReview = async (payload: {
  id: number;
  status: "approved" | "rejected";
  review_note?: string | null;
}) => {
  if (!canManageAttendance.value) {
    ElMessage.error("You do not have permission to review correction requests.");
    return;
  }

  isCorrectionReviewSubmitting.value = true;

  try {
    const response = await reviewCorrectionRequest(payload.id, {
      status: payload.status,
      review_note: payload.review_note ?? null,
    });

    ElMessage.success(response.message);
    closeCorrectionReviewModal();
    await Promise.all([
      fetchCorrectionRequests(buildCorrectionRequestParams(correctionRequestsPage.value)),
      fetchAttendanceList(buildAttendanceListParams(attendanceListPage.value)).catch(() => undefined),
      refreshSelfServiceAttendance().catch(() => undefined),
    ]);
  } catch (err) {
    ElMessage.error(getAttendanceRequestErrorMessage(err));
  } finally {
    isCorrectionReviewSubmitting.value = false;
  }
};

const handleApplyFilters = async () => {
  attendanceListPage.value = 1;
  correctionRequestsPage.value = 1;
  await loadAttendance();
};

const downloadExportFile = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
};

function buildAttendanceExportParams() {
  const dateRange = getMonthDateRange(selectedMonth.value);
  const employeeId = Number(employeeIdFilter.value);

  return {
    month: selectedMonth.value || undefined,
    employee_id:
      Number.isFinite(employeeId) && employeeId > 0 ? employeeId : undefined,
    department_id:
      selectedDepartmentId.value !== undefined
        ? Number(selectedDepartmentId.value)
        : undefined,
    status: statusFilter.value || undefined,
    from_date: dateRange.from,
    to_date: dateRange.to,
  };
}

const handleExportExcel = async () => {
  if (!canExportAttendance.value) {
    return;
  }

  isExportingExcel.value = true;

  try {
    const response = await exportExcel(buildAttendanceExportParams());
    downloadExportFile(response.blob, response.filename);
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "Failed to export attendance.");
  } finally {
    isExportingExcel.value = false;
  }
};

const syncOutageRecoveryPreview = ({
  resetSelection = false,
  resetNotes = false,
  resetTimes = false,
}: {
  resetSelection?: boolean;
  resetNotes?: boolean;
  resetTimes?: boolean;
} = {}) => {
  const preview = outageRecoveryPreview.value;

  if (!preview) {
    selectedOutageRecoveryEmployeeIds.value = [];
    outageRecoveryNotes.value = "";
    return;
  }

  const previewSelectedIds = preview.selectedEmployees.data
    .filter((employee) => employee.selected)
    .map((employee) => employee.id);

  selectedOutageRecoveryEmployeeIds.value = resetSelection
    ? previewSelectedIds
    : Array.from(new Set([...selectedOutageRecoveryEmployeeIds.value, ...previewSelectedIds]));

  if (resetNotes || !outageRecoveryNotes.value.trim()) {
    outageRecoveryNotes.value = preview.defaults.notes ?? "";
  }

  if (resetTimes || !outageRecoveryCheckInAt.value || !outageRecoveryCheckOutAt.value) {
    outageRecoveryCheckInAt.value = preview.defaults.checkInAt
      ? new Date(preview.defaults.checkInAt)
      : null;
    outageRecoveryCheckOutAt.value = preview.defaults.checkOutAt
      ? new Date(preview.defaults.checkOutAt)
      : null;
  }
};

const buildOutageRecoveryPreviewParams = () => ({
  date: outageRecoveryDate.value,
  search: outageRecoverySearch.value.trim() || undefined,
  department_id:
    outageRecoveryDepartmentId.value !== null && outageRecoveryDepartmentId.value !== undefined
      ? Number(outageRecoveryDepartmentId.value)
      : undefined,
  per_page: outageRecoveryPerPage.value,
  page: outageRecoveryPage.value,
});

const loadOutageRecoveryPreview = async (options?: {
  resetSelection?: boolean;
  resetNotes?: boolean;
  resetTimes?: boolean;
}) => {
  const response = await fetchOutageRecoveryPreview({
    ...buildOutageRecoveryPreviewParams(),
  });

  syncOutageRecoveryPreview(options);
  return response;
};

const handlePreviewOutageRecovery = async () => {
  outageRecoveryPage.value = 1;
  await loadOutageRecoveryPreview({
    resetSelection: true,
    resetNotes: true,
    resetTimes: true,
  });
};

const handleOutageRecoveryPageChange = async (page: number) => {
  outageRecoveryPage.value = page;
  await loadOutageRecoveryPreview();
};

const handleResetOutageRecoveryFilters = async () => {
  outageRecoverySearch.value = "";
  outageRecoveryDepartmentId.value = null;
  outageRecoveryPerPage.value = 10;
  outageRecoveryPage.value = 1;
  selectedOutageRecoveryEmployeeIds.value = [];
  outageRecoveryNotes.value = "";
  await loadOutageRecoveryPreview({
    resetSelection: true,
    resetNotes: true,
    resetTimes: true,
  });
};

const handleApplyOutageRecovery = async () => {
  if (!outageRecoveryPreview.value || !selectedOutageRecoveryEmployeeIds.value.length) {
    return;
  }

  try {
    const response = await applyOutageRecovery({
      date: outageRecoveryDate.value,
      employee_ids: selectedOutageRecoveryEmployeeIds.value,
      notes: outageRecoveryNotes.value.trim() || outageRecoveryPreview.value.defaults.notes,
      ...buildOutageRecoveryApplyTimePayload(),
    });

    ElMessage.success(
      response.message ?? "Outage recovery attendance created successfully.",
    );
    await loadAttendance();
  } catch (err) {
    ElMessage.error(getAttendanceRequestErrorMessage(err, "Failed to apply outage recovery."));
  }
};

const handleAttendanceListPageChange = async (page: number) => {
  attendanceListPage.value = page;

  try {
    await fetchAttendanceList(buildAttendanceListParams(page));
  } catch {
    // Error state is handled by the attendance store.
  }
};

const handleCorrectionRequestsPageChange = async (page: number) => {
  correctionRequestsPage.value = page;

  try {
    await fetchCorrectionRequests(buildCorrectionRequestParams(page));
  } catch {
    // Error state is handled by the attendance store.
  }
};

watch(
  () => availableManagementTabs.value,
  (nextTabs) => {
    if (!nextTabs.length) {
      return;
    }

    if (!nextTabs.includes(hrManagementTab.value)) {
      hrManagementTab.value = nextTabs[0] ?? "department-summary";
    }
  },
  { immediate: true },
);

watch(
  () => canViewOrganizationAttendanceSummary.value,
  async (canViewSummary) => {
    if (!canAccessAttendanceWorkspace.value) {
      return;
    }

    if (!canViewSummary) {
      selectedDepartmentId.value = undefined;
    }

    await loadAttendance();
  },
  { immediate: true },
);

watch(
  () => outageRecoveryDate.value,
  async () => {
    outageRecoveryPage.value = 1;
    selectedOutageRecoveryEmployeeIds.value = [];
    outageRecoveryNotes.value = "";
    outageRecoveryMode.value = "full_day";

    if (canManageAttendance.value) {
      await loadOutageRecoveryPreview({
        resetSelection: true,
        resetNotes: true,
        resetTimes: true,
      }).catch(() => undefined);
    }
  },
);

function formatCount(value: number | null | undefined) {
  return String(value ?? 0);
}

function getAttendanceRequestErrorMessage(
  error: unknown,
  fallback = "Attendance request failed. Please try again.",
) {
  if (axios.isAxiosError<AttendanceRequestErrorPayload>(error)) {
    const errorPayload = error.response?.data;
    const firstValidationMessage = errorPayload?.errors
      ? Object.values(errorPayload.errors).flat()[0]
      : null;

    return firstValidationMessage ?? errorPayload?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";

  return new Date(value).toLocaleDateString();
}

function formatTime(value: string | null | undefined) {
  return formatTime12h(value);
}

function formatMinutes(value: number | null | undefined) {
  const minutes = value ?? 0;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function buildOutageRecoveryApplyTimePayload() {
  if (outageRecoveryMode.value === "morning") {
    return {
      check_in_time: formatDateTimeWithOffset(outageRecoveryCheckInAt.value),
      check_out_time: null,
    };
  }

  if (outageRecoveryMode.value === "evening") {
    return {
      check_out_time: formatDateTimeWithOffset(outageRecoveryCheckOutAt.value),
    };
  }

  return {};
}

function buildAttendanceListParams(page = 1) {
  const dateRange = getMonthDateRange(selectedMonth.value);
  const employeeId = Number(employeeIdFilter.value);

  return {
    employee_id:
      Number.isFinite(employeeId) && employeeId > 0 ? employeeId : undefined,
    department_id:
      selectedDepartmentId.value !== undefined
        ? Number(selectedDepartmentId.value)
        : undefined,
    status: statusFilter.value || undefined,
    from_date: dateRange.from,
    to_date: dateRange.to,
    page,
    per_page: 15,
  };
}

function buildCorrectionRequestParams(page = 1) {
  const dateRange = getMonthDateRange(selectedMonth.value);

  return {
    status: "pending",
    from_date: dateRange.from,
    to_date: dateRange.to,
    page,
    per_page: 10,
  };
}

function getCurrentMonth() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${now.getFullYear()}-${month}`;
}

function getTodayDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function getMonthDateRange(monthValue: string) {
  const [yearString, monthString] = monthValue.split("-");
  const year = Number(yearString);
  const monthIndex = Number(monthString) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0) {
    return {
      from: getTodayDate(),
      to: getTodayDate(),
    };
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  return {
    from: formatDateInput(firstDay),
    to: formatDateInput(lastDay),
  };
}

function formatDateInput(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${value.getFullYear()}-${month}-${day}`;
}

function formatDateTimeWithOffset(value: Date | null) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  const timezoneOffsetMinutes = -value.getTimezoneOffset();
  const offsetSign = timezoneOffsetMinutes >= 0 ? "+" : "-";
  const absoluteOffsetMinutes = Math.abs(timezoneOffsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffsetMinutes / 60)).padStart(2, "0");
  const offsetMinutes = String(absoluteOffsetMinutes % 60).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
}
</script>

<template>
  <main class="attendance-page">
    <BaseCard class="attendance-header-card">
      <div class="attendance-header">
        <div class="attendance-header-copy">
          <p class="attendance-header-eyebrow">Attendance workspace</p>
          <div class="attendance-header-text">
            <h1 class="attendance-title">Attendance</h1>
            <p class="attendance-subtitle">
              Attendance view adapts to your available attendance permissions and the connected attendance APIs.
            </p>
          </div>
        </div>

        <div class="attendance-header-actions">
          <p class="attendance-last-updated">Last updated: {{ formattedLastUpdated }}</p>
          <div class="attendance-header-buttons">
            <BaseButton
              v-if="canExportAttendance"
              :disabled="!hasData || isLoading"
              :loading="isExportingExcel"
              variant="ghost"
              @click="handleExportExcel"
            >
              Export Excel
            </BaseButton>
            <BaseButton :loading="isLoading" variant="secondary" @click="loadAttendance">
              Refresh
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <div v-if="isLoading && !hasData" class="attendance-loading">
      <BaseCard v-for="index in 6" :key="index" class="attendance-skeleton-card">
        <div class="attendance-skeleton-body">
          <div class="attendance-skeleton-line short" />
          <div class="attendance-skeleton-line large" />
          <BaseSpinner />
        </div>
      </BaseCard>
    </div>

    <BaseCard v-else-if="error" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">Failed to load attendance</h3>
        <p class="attendance-state-text">{{ error }}</p>
        <BaseButton @click="loadAttendance">Try Again</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="!canAccessAttendanceWorkspace" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">Attendance access unavailable</h3>
        <p class="attendance-state-text">
          This account does not currently have permission to access the attendance workspace.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="!hasData" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">No attendance data</h3>
        <p class="attendance-state-text">Attendance data is not available for this user type yet.</p>
      </div>
    </BaseCard>

    <template v-else-if="!hasOrganizationAttendanceAccess && (canShowSelfAttendanceSummary || canShowSelfActions)">
      <BaseCard v-if="canShowSelfAttendanceSummary" class="attendance-identity-card">
        <div class="attendance-identity-body">
          <div>
            <p class="attendance-section-label">Employee</p>
            <h2 class="attendance-identity-title">{{ employeeIdentity?.name ?? "--" }}</h2>
          </div>
          <div class="attendance-identity-meta">
            <span class="attendance-meta-item">
              <Briefcase :size="16" />
              {{ employeeIdentity?.department ?? "--" }}
            </span>
            <span class="attendance-meta-item">
              <Users :size="16" />
              ID #{{ employeeIdentity?.id ?? "--" }}
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard v-if="canShowSelfAttendanceSummary" class="attendance-today-card">
        <div class="attendance-today-header">
          <div>
            <h3 class="attendance-section-title">Today Attendance</h3>
            <p class="attendance-section-text">
              Self-service attendance state for {{ formatDate(employeeToday?.attendanceDate) }}.
            </p>
          </div>

          <div class="attendance-today-badges">
            <AttendanceStatusBadge :status="employeeToday?.todayAttendanceStatus" />
            <AttendanceStatusBadge :status="employeeToday?.correctionStatus" />
          </div>
        </div>

        <div class="attendance-today-grid">
          <div class="attendance-detail-card">
            <span class="attendance-detail-label">Next Action</span>
            <div class="attendance-detail-inline">
              <Clock3 :size="16" />
              <span class="attendance-detail-value">
                {{
                  employeeToday?.nextAction
                    ? employeeToday.nextAction
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")
                    : "--"
                }}
              </span>
            </div>
          </div>

          <div v-for="detail in todayDetails" :key="detail.key" class="attendance-detail-card">
            <span class="attendance-detail-label">{{ detail.label }}</span>
            <span class="attendance-detail-value">{{ detail.value }}</span>
          </div>
        </div>
      </BaseCard>

      <AttendanceEmployeeActions
        v-if="canShowSelfActions"
        :action-error="selfServiceActionError"
        :action-loading="selfServiceActionLoading"
        :action-success="selfServiceActionSuccess"
        :can-correction-action="canOpenCorrectionRequest"
        :can-missing-attendance-action="canOpenMissingAttendanceRequest"
        :can-primary-action="canUseSelfAttendanceActions"
        :can-scan-action="canUseSelfAttendanceActions"
        :correction-status="employeeToday?.correctionStatus ?? 'none'"
        :next-action="employeeToday?.nextAction ?? null"
        :request-loading="selfServiceRequestLoading"
        @correction-action="handleOpenCorrectionRequest"
        @missing-attendance-action="handleOpenMissingAttendanceRequest"
        @primary-action="handleSelfServiceAction"
        @scan-action="handleOpenScanFlow"
      />

      <section v-if="canShowSelfAttendanceSummary" class="attendance-summary-section">
        <div>
          <h3 class="attendance-section-title">This Week</h3>
          <p class="attendance-section-text">Weekly self-service attendance summary.</p>
        </div>
        <DashboardSummaryCards :items="employeeWeekCards" />
      </section>

      <section class="attendance-summary-section">
        <div>
          <h3 class="attendance-section-title">This Month</h3>
          <p class="attendance-section-text">Monthly self-service attendance summary.</p>
        </div>
        <DashboardSummaryCards :items="employeeMonthCards" tone="secondary" />
      </section>

      <section v-if="canShowSelfAttendanceHistory" class="attendance-summary-section">
        <AttendanceRecordsTable
          :records="employeeAttendanceHistory"
          :show-employee-columns="false"
          :show-pagination="false"
          description="Review your recent attendance records, status, and correction state."
          title="My Attendance History"
        />
      </section>
    </template>

    <template v-else-if="hasOrganizationAttendanceAccess">
      <section v-if="canShowSelfActions" class="attendance-summary-section">
        <div class="attendance-section-copy">
          <h3 class="attendance-section-title">My Attendance Actions</h3>
          <p class="attendance-section-text">
            Use the attendance actions you have permission to access from the same workspace.
          </p>
        </div>

        <AttendanceEmployeeActions
          :action-error="selfServiceActionError"
          :action-loading="selfServiceActionLoading"
          :action-success="selfServiceActionSuccess"
          :can-correction-action="canOpenCorrectionRequest"
          :can-missing-attendance-action="canOpenMissingAttendanceRequest"
          :can-primary-action="canUseSelfAttendanceActions"
          :can-scan-action="canUseSelfAttendanceActions"
          :correction-status="employeeToday?.correctionStatus ?? 'none'"
          :next-action="employeeToday?.nextAction ?? null"
          :request-loading="selfServiceRequestLoading"
          @correction-action="handleOpenCorrectionRequest"
          @missing-attendance-action="handleOpenMissingAttendanceRequest"
          @primary-action="handleSelfServiceAction"
          @scan-action="handleOpenScanFlow"
        />
      </section>

      <section v-if="canViewOrganizationAttendanceSummary && organizationData" class="attendance-summary-section">
        <div class="attendance-section-copy">
          <h3 class="attendance-section-title">Attendance Overview</h3>
          <p class="attendance-section-text">
            Monthly reporting context and quick organization-wide attendance status for the selected window.
          </p>
        </div>

        <BaseCard class="attendance-overview-card">
          <div class="attendance-overview-body">
            <div class="attendance-overview-main">
              <div class="attendance-overview-block">
                <span class="attendance-overview-label">Month</span>
                <strong class="attendance-overview-value">{{ organizationData.month ?? "--" }}</strong>
              </div>

              <div class="attendance-overview-block">
                <span class="attendance-overview-label">Date Range</span>
                <div class="attendance-overview-range">
                  <span class="attendance-meta-item attendance-overview-range-item">
                    <CalendarDays :size="16" />
                    {{ formatDate(organizationData.dateRange?.from) }}
                  </span>
                  <span class="attendance-meta-separator">to</span>
                  <span class="attendance-meta-item attendance-overview-range-item">
                    <CalendarDays :size="16" />
                    {{ formatDate(organizationData.dateRange?.to) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="attendance-overview-stats">
              <div class="attendance-overview-stat">
                <span class="attendance-overview-stat-label">Departments</span>
                <strong class="attendance-overview-stat-value">
                  {{ organizationData.byDepartment?.length ?? 0 }}
                </strong>
              </div>
              <div class="attendance-overview-stat">
                <span class="attendance-overview-stat-label">Pending Requests</span>
                <strong class="attendance-overview-stat-value">
                  {{ organizationData.totals?.pendingCorrectionRequestsCount ?? 0 }}
                </strong>
              </div>
            </div>
          </div>
        </BaseCard>
      </section>

      <section v-if="canViewOrganizationAttendanceSummary && organizationData" class="attendance-card-group attendance-card-group-primary">
        <div class="attendance-card-group-header">
          <div class="attendance-card-group-copy">
            <p class="attendance-card-group-eyebrow">Core metrics</p>
            <h3 class="attendance-section-title">Operational Snapshot</h3>
            <p class="attendance-section-text">
              The core attendance metrics for the selected month at a glance.
            </p>
          </div>
        </div>
        <DashboardSummaryCards :items="organizationPrimaryCards" />
      </section>
      <section v-if="canViewOrganizationAttendanceSummary && organizationData" class="attendance-card-group attendance-card-group-secondary">
        <div class="attendance-card-group-header">
          <div class="attendance-card-group-copy">
            <p class="attendance-card-group-eyebrow">Efficiency and exceptions</p>
            <h3 class="attendance-section-title">Work Time & Follow-up</h3>
            <p class="attendance-section-text">
              Review worked time, absences, and open correction workload in one place.
            </p>
          </div>
        </div>
        <DashboardSummaryCards :items="organizationSecondaryCards" tone="secondary" />
      </section>

      <section v-if="canShowAttendanceToolbar" class="attendance-toolbar-section">
        <BaseCard class="attendance-filters-card">
          <div class="attendance-toolbar-header">
            <div class="attendance-toolbar-copy">
              <p class="attendance-toolbar-label">Management filters</p>
              <p class="attendance-toolbar-text">
                Narrow the attendance records shown for this month.
              </p>
            </div>
          </div>

          <div class="attendance-filters-grid attendance-filters-grid-toolbar">
            <BaseDatePicker
              v-model="selectedMonth"
              label="Month"
              format="MMMM YYYY"
              type="month"
              value-format="YYYY-MM"
              size="large"
            />
            <BaseDropdown
              v-model="selectedDepartmentId"
              :disabled="!canViewOrganizationAttendanceSummary"
              label="Department"
              :options="departmentFilterOptions"
              placeholder="All available departments"
            />
            <BaseDropdown
              v-model="statusFilter"
              :options="statusFilterOptions"
              clearable
              label="Status"
              placeholder="All statuses"
            />
            <BaseInput
              v-model="employeeIdFilter"
              label="Employee ID"
              placeholder="Filter by employee ID"
              size="large"
            />
            <div class="attendance-filters-actions attendance-filters-actions-toolbar">
              <BaseButton :loading="isLoading" variant="secondary" @click="handleApplyFilters">
                Apply Filters
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </section>

      <section v-if="canShowAttendanceManagement" class="attendance-summary-section">
        <div class="attendance-section-copy">
          <h3 class="attendance-section-title">Attendance Management</h3>
          <p class="attendance-section-text">
            Review department totals and manage attendance activity from one workspace.
          </p>
        </div>

        <div class="attendance-management-card">
          <ElTabs v-model="hrManagementTab" class="attendance-management-tabs">
            <ElTabPane v-if="canViewOrganizationAttendanceSummary" label="Department Summary" name="department-summary">
              <AttendanceDepartmentSummary :rows="organizationData?.byDepartment ?? []" />
            </ElTabPane>

            <ElTabPane v-if="canViewAttendanceRecords" label="Attendance Records" name="records">
              <AttendanceRecordsTable
                :records="attendanceList"
                @page-change="handleAttendanceListPageChange"
              />
            </ElTabPane>

            <ElTabPane v-if="canViewAttendanceRecords" label="Correction Requests" name="correction-requests">
              <AttendanceCorrectionRequests
                :can-review="canManageAttendance"
                :embedded="true"
                :requests="correctionRequests"
                @page-change="handleCorrectionRequestsPageChange"
                @review-click="handleOpenCorrectionReview"
              />
            </ElTabPane>

            <ElTabPane v-if="canManageAttendance" label="Outage Recovery" name="outage-recovery">
              <AttendanceOutageRecoveryPanel
                v-model:department-id="outageRecoveryDepartmentId"
                v-model:notes="outageRecoveryNotes"
                v-model:preview-date="outageRecoveryDate"
                v-model:per-page="outageRecoveryPerPage"
                v-model:recovery-check-in-at="outageRecoveryCheckInAt"
                v-model:recovery-check-out-at="outageRecoveryCheckOutAt"
                v-model:recovery-mode="outageRecoveryMode"
                v-model:search="outageRecoverySearch"
                v-model:selected-employee-ids="selectedOutageRecoveryEmployeeIds"
                :applying="isOutageRecoveryApplying"
                :department-options="departmentFilterOptions"
                :error="outageRecoveryError"
                :loading="isOutageRecoveryLoading"
                :preview="outageRecoveryPreview"
                @apply="handleApplyOutageRecovery"
                @page-change="handleOutageRecoveryPageChange"
                @preview="handlePreviewOutageRecovery"
                @reset-filters="handleResetOutageRecoveryFilters"
              />
            </ElTabPane>
          </ElTabs>
        </div>
      </section>

      <AttendancePlaceholderSection
        v-if="canViewAttendanceAudit"
        description="Audit logs and oversight-specific attendance reporting can be added here when those read-only endpoints are connected to this page."
        title="Audit & Oversight"
      />
    </template>

    <AttendanceCorrectionRequestModal
      :request-date-options="correctionRequestAttendanceOptions"
      :initial-request-date="correctionRequestDate"
      :open="isCorrectionRequestModalOpen"
      :submitting="selfServiceRequestLoading"
      @close="closeCorrectionRequestModal"
      @submit="handleSubmitCorrectionRequest"
    />

    <AttendanceMissingRequestModal
      :existing-attendance-dates="
        (employeeAttendanceHistory?.data ?? []).map((record) => record.attendanceDate)
      "
      :open="isMissingRequestModalOpen"
      :submitting="selfServiceRequestLoading"
      @close="closeMissingRequestModal"
      @submit="handleSubmitMissingAttendanceRequest"
    />

    <AttendanceCorrectionReviewModal
      :open="isCorrectionReviewModalOpen"
      :request="selectedCorrectionRequest"
      :submitting="isCorrectionReviewSubmitting"
      @close="closeCorrectionReviewModal"
      @submit="handleSubmitCorrectionReview"
    />
  </main>
</template>

<style scoped>
.attendance-page {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding-bottom: 1rem;
}

.attendance-header-card,
.attendance-overview-card,
.attendance-card-group,
.attendance-today-card,
.attendance-filters-card,
.attendance-management-card {
  overflow: hidden;
}

.attendance-header-card {
  position: relative;
  border-color: hsl(var(--primary) / 0.14);
  border-radius: calc(var(--radius) + 0.55rem);
  background:
    radial-gradient(circle at top right, hsl(var(--primary) / 0.16), transparent 30%),
    linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent 36%),
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.26) 100%);
  box-shadow: var(--shadow-card-hover);
}

.attendance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.35rem 1.5rem;
}

.attendance-header-copy,
.attendance-header-text,
.attendance-section-copy,
.attendance-card-group-copy,
.attendance-overview-main,
.attendance-overview-block {
  display: flex;
  flex-direction: column;
}

.attendance-header-copy,
.attendance-card-group-copy,
.attendance-overview-main,
.attendance-overview-block {
  gap: 0.3rem;
}

.attendance-header-text {
  gap: 0.38rem;
}

.attendance-header-eyebrow,
.attendance-card-group-eyebrow {
  color: hsl(var(--primary));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.attendance-header-actions {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 0.75rem;
}

.attendance-header-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.attendance-management-card {
  border: 1px solid hsl(var(--primary) / 0.14);
  border-radius: calc(var(--radius) + 0.25rem);
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.1) 100%);
  box-shadow: var(--shadow-card);
  padding: 0.875rem 1rem 1rem;
}

.attendance-management-tabs :deep(.el-tabs__header) {
  margin-bottom: 0.75rem;
  padding-bottom: 0;
}

.attendance-management-tabs :deep(.el-tabs__nav) {
  gap: 1.25rem;
}

.attendance-management-tabs :deep(.el-tabs__nav-wrap::after) {
  background: hsl(var(--border-gray));
}

.attendance-management-tabs :deep(.el-tabs__item) {
  color: hsl(var(--muted-foreground));
  font-weight: 600;
  min-height: 2.75rem;
  padding-inline: 0;
  transition: color 0.18s ease;
}

.attendance-management-tabs :deep(.el-tabs__item:hover) {
  color: hsl(var(--foreground));
}

.attendance-management-tabs :deep(.el-tabs__item.is-active) {
  color: hsl(var(--foreground));
}

.attendance-management-tabs :deep(.el-tabs__active-bar) {
  background: hsl(var(--primary));
  height: 3px;
}

.attendance-management-tabs :deep(.el-tab-pane) {
  display: flex;
  flex-direction: column;
}

.attendance-management-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.attendance-title,
.attendance-section-title,
.attendance-identity-title,
.attendance-state-title {
  color: hsl(var(--foreground));
}

.attendance-title {
  font-size: clamp(2rem, 2.4vw, 2.45rem);
  font-weight: 800;
  line-height: 1.03;
  letter-spacing: -0.03em;
}

.attendance-subtitle,
.attendance-last-updated,
.attendance-section-text,
.attendance-state-text,
.attendance-detail-label,
.attendance-section-label {
  color: hsl(var(--muted-foreground));
}

.attendance-subtitle {
  max-width: 44rem;
  font-size: 0.96rem;
  line-height: 1.55;
}

.attendance-last-updated {
  font-size: var(--text-xs);
  padding: 0.5rem 0.82rem;
  border-radius: 9999px;
  border: 1px solid hsl(var(--border-gray));
  background: hsl(var(--card) / 0.74);
  backdrop-filter: blur(8px);
}

.attendance-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
}

.attendance-skeleton-card {
  min-height: 10rem;
}

.attendance-skeleton-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.attendance-skeleton-line {
  border-radius: 9999px;
  background: hsl(var(--secondary));
}

.attendance-skeleton-line.short {
  width: 40%;
  height: 0.75rem;
}

.attendance-skeleton-line.large {
  width: 65%;
  height: 2rem;
}

.attendance-state-card {
  min-height: 12rem;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.18) 100%);
}

.attendance-state-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem;
  text-align: center;
}

.attendance-identity-body,
.attendance-overview-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.attendance-overview-card {
  border-color: hsl(var(--border-gray));
  background: hsl(var(--card));
  box-shadow: var(--shadow-card);
}

.attendance-card-group {
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) + 0.3rem);
  padding: 1rem 1rem 1.05rem;
  box-shadow: var(--shadow-card);
}

.attendance-card-group-primary {
  border-color: hsl(var(--primary) / 0.14);
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.14) 100%);
}

.attendance-card-group-secondary {
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.08) 100%);
}

.attendance-identity-meta,
.attendance-overview-range,
.attendance-today-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.attendance-meta-item,
.attendance-detail-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: hsl(var(--foreground));
}

.attendance-overview-body {
  gap: 1.4rem;
  padding: 1.15rem 1.25rem;
}

.attendance-overview-main {
  min-width: 0;
  gap: 0.9rem;
}

.attendance-overview-block {
  gap: 0.35rem;
}

.attendance-overview-label,
.attendance-overview-stat-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attendance-overview-value {
  color: hsl(var(--foreground));
  font-size: clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem);
  font-weight: 700;
  line-height: 1.15;
}

.attendance-overview-range {
  gap: 0.55rem;
}

.attendance-overview-range-item {
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.16);
}

.attendance-overview-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(7.5rem, auto));
  gap: 0.75rem;
}

.attendance-overview-stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) - 0.05rem);
  background: hsl(var(--secondary) / 0.12);
}

.attendance-overview-stat-value {
  color: hsl(var(--foreground));
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
}

.attendance-meta-separator {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
}

.attendance-today-card {
  border-color: hsl(var(--primary) / 0.14);
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.24) 100%);
}

.attendance-today-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.attendance-today-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.attendance-detail-card {
  display: flex;
  min-height: 6rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: inset 0 1px 0 hsl(var(--primary) / 0.04);
}

.attendance-detail-value {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 700;
  color: hsl(var(--foreground));
}

.attendance-summary-section {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.attendance-toolbar-section {
  display: flex;
  flex-direction: column;
}

.attendance-section-copy {
  gap: 0.2rem;
}

.attendance-toolbar-header,
.attendance-toolbar-copy {
  display: flex;
  flex-direction: column;
}

.attendance-toolbar-header {
  padding: 0.85rem 0.95rem 0;
}

.attendance-toolbar-copy {
  gap: 0.18rem;
}

.attendance-toolbar-label {
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.attendance-toolbar-text {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
  line-height: 1.45;
}

.attendance-card-group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.1rem 0.05rem 0.95rem;
}

.attendance-filters-card {
  border-color: hsl(var(--border-gray));
  background: hsl(var(--secondary) / 0.08);
  box-shadow: none;
}

.attendance-filters-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.875rem;
  padding: 0.9rem 1rem;
  align-items: center;
}

.attendance-filters-grid-toolbar {
  padding-top: 0.7rem;
}

.attendance-filters-actions {
  display: flex;
  justify-content: flex-end;
  align-self: end;
}

.attendance-filters-actions-toolbar {
  min-width: 9.5rem;
}

.attendance-page :deep(.summary-card-primary),
.attendance-page :deep(.summary-card-secondary) {
  position: relative;
  min-height: 9rem;
  border: 1px solid hsl(var(--border-gray));
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.14) 100%);
  box-shadow: var(--shadow-card-hover);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.attendance-page :deep(.summary-card-primary::before),
.attendance-page :deep(.summary-card-secondary::before) {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.16) 100%);
}

.attendance-page :deep(.summary-card-primary) {
  border-color: hsl(var(--primary) / 0.12);
}

.attendance-page :deep(.summary-card-secondary) {
  border-color: hsl(var(--border-gray));
}

.attendance-page :deep(.summary-card-primary:hover),
.attendance-page :deep(.summary-card-secondary:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.attendance-page :deep(.summary-grid-primary) {
  gap: 0.95rem;
}

.attendance-page :deep(.summary-grid-secondary) {
  gap: 0.95rem;
}

.attendance-page :deep(.summary-card-body) {
  gap: 0.9rem;
  padding: 1rem 1.05rem 1.05rem;
}

.attendance-page :deep(.summary-card-header) {
  align-items: flex-start;
}

.attendance-page :deep(.summary-label) {
  color: hsl(var(--foreground) / 0.78);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.attendance-page :deep(.summary-icon-shell) {
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid hsl(var(--primary) / 0.08);
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
  box-shadow: inset 0 1px 0 hsl(var(--card) / 0.55);
}

.attendance-page :deep(.summary-icon) {
  color: hsl(var(--primary));
}

.attendance-page :deep(.summary-value) {
  color: hsl(var(--foreground));
  letter-spacing: -0.03em;
}

.attendance-page :deep(.summary-value-primary) {
  font-size: clamp(1.85rem, 2.3vw, 2.35rem);
}

.attendance-page :deep(.summary-value-secondary) {
  font-size: clamp(1.5rem, 1.8vw, 1.95rem);
}

.attendance-page :deep(.summary-card-primary:nth-child(1)) {
  border-color: hsl(var(--primary) / 0.18);
  background:
    linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent 44%),
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.18) 100%);
}

.attendance-page :deep(.summary-card-primary:nth-child(3)),
.attendance-page :deep(.summary-card-secondary:last-child) {
  border-color: hsl(var(--primary) / 0.14);
}

.attendance-page :deep(.summary-card-primary:nth-child(3)::before),
.attendance-page :deep(.summary-card-secondary:last-child::before) {
  background: linear-gradient(90deg, hsl(var(--destructive) / 0.7) 0%, hsl(var(--destructive) / 0.14) 100%);
}

.attendance-page :deep(.summary-card-primary:nth-child(2)::before),
.attendance-page :deep(.summary-card-secondary:nth-child(2)::before) {
  background: linear-gradient(90deg, hsl(var(--primary) / 0.9) 0%, hsl(var(--primary) / 0.14) 100%);
}

.attendance-page :deep(.summary-helper) {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .attendance-header,
  .attendance-identity-body,
  .attendance-overview-body,
  .attendance-today-header,
  .attendance-card-group-header {
    flex-direction: column;
  }

  .attendance-header-actions {
    width: 100%;
    align-items: flex-start;
  }

  .attendance-header-buttons {
    justify-content: flex-start;
  }

  .attendance-filters-actions {
    justify-content: flex-start;
  }

  .attendance-overview-range {
    flex-wrap: wrap;
  }

  .attendance-overview-stats {
    width: 100%;
  }

  .attendance-filters-grid {
    grid-template-columns: 1fr;
  }

  .attendance-toolbar-header {
    padding-bottom: 0.1rem;
  }
}
</style>
