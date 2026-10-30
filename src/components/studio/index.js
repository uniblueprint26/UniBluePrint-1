// Barrel export for the Studio component library -- every future internal
// hub imports from here rather than reaching into individual files.
export { default as StudioShell } from './StudioShell'
export { default as QuoteBanner } from './QuoteBanner'
export { default as GreetingBanner } from './GreetingBanner'
export { default as StudioSidebar } from './StudioSidebar'
export { default as StatusDot } from './StatusDot'
export { default as MetricBarChart } from './MetricBarChart'
export { default as ComparisonWidget } from './ComparisonWidget'
export { default as StatStrip } from './StatStrip'
// Studio Phase 13 -- dashboard intelligence layer.
export { default as TrendLineChart } from './TrendLineChart'
export { default as DonutChart } from './DonutChart'
export { default as Sparkline } from './Sparkline'
export { default as HealthBadge } from './HealthBadge'
export { default as PeriodToggle } from './PeriodToggle'
export { default as ChartExportButton } from './ChartExportButton'
export { default as GlanceCard } from './GlanceCard'
export { default as MiniCalendar } from './MiniCalendar'
export { default as ActivityHeatmap } from './ActivityHeatmap'
// SectionJumpNav.jsx is fully superseded by StudioSidebar (Studio Phase
// 12) -- StudioShell no longer renders it, and nothing else in the repo
// imports it (checked via grep before this change). Left in the repo
// un-exported rather than deleted, since the brief only asked to keep it
// if something else used it, not to remove the file outright.
export { default as TaskBoard } from './TaskBoard'
export { default as RequestPanel } from './RequestPanel'
export { StudioCard, SectionTitle, EmptyNote, StudioField, Eyebrow } from './StudioPrimitives'
export { SkeletonBlock, ChartSkeleton, ListSkeleton, TableSkeleton, StatStripSkeleton } from './Skeleton'
export { useStudioTheme } from './useStudioTheme'
// Studio Phase 14 -- navigation/identity layer.
export { default as Avatar } from './Avatar'
export { avatarColorFor, initialsFor } from './avatarColor'
export { default as CommandPalette } from './CommandPalette'
export { default as QuickAddFab } from './QuickAddFab'
export { default as AccountAvatarButton } from './AccountAvatarButton'
export { default as SortTh } from './SortTh'
export { useSortableTable } from './useSortableTable'
export { HUB_REGISTRY, hubsAccessibleTo } from './hubRegistry'
export * from './comparisonCopy'
export * from './theme'
export * from './quotes'
