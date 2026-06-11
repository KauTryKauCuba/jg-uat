interface StatusBadgeProps {
  status: "pass" | "fail" | "submitted" | "in_progress" | "not_started" | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let badgeClass = ""
  let label = ""

  switch (status) {
    case "pass":
      badgeClass = "bg-green-100 text-green-700"
      label = "Pass"
      break
    case "fail":
      badgeClass = "bg-red-100 text-red-700"
      label = "Fail"
      break
    case "submitted":
      badgeClass = "bg-blue-100 text-blue-700"
      label = "Submitted"
      break
    case "in_progress":
      badgeClass = "bg-yellow-100 text-yellow-700"
      label = "In Progress"
      break
    case "not_started":
    default:
      badgeClass = "bg-gray-100 text-gray-600"
      label = "Not Started"
      break
  }

  return (
    <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 whitespace-nowrap ${badgeClass}`}>
      {label}
    </span>
  )
}
