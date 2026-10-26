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
export * from './comparisonCopy'
export * from './theme'
export * from './quotes'
