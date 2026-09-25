// Inspection workflow constants

export const INSPECTION_STAGES = [
  { id: 'ACCEPTED', label: 'Job Accepted', icon: 'CheckCircle' },
  { id: 'EN_ROUTE', label: 'En Route', icon: 'Navigation' },
  { id: 'ARRIVED', label: 'On Site', icon: 'MapPin' },
  { id: 'PRE_INSPECTION', label: 'Client Interview', icon: 'MessageSquare' },
  { id: 'INSPECTING', label: 'Inspection', icon: 'Camera' },
  { id: 'POST_INSPECTION', label: 'Findings', icon: 'ClipboardList' },
  { id: 'VIDEO_ATTACH', label: 'Attach Video', icon: 'Video' },
  { id: 'CLIENT_SIGNOFF', label: 'Client Sign-off', icon: 'PenTool' },
  { id: 'SUBMITTED', label: 'Submitted', icon: 'Send' },
] as const;

export const PIPE_MATERIALS = [
  { value: 'CAST_IRON', label: 'Cast Iron', era: 'Pre-1970s' },
  { value: 'CLAY', label: 'Clay/Terra Cotta', era: 'Pre-1970s' },
  { value: 'PVC', label: 'PVC', era: '1970s-Present' },
  { value: 'ABS', label: 'ABS', era: '1970s-Present' },
  { value: 'ORANGEBURG', label: 'Orangeburg (Tar Paper)', era: '1940s-1970s' },
  { value: 'CONCRETE', label: 'Concrete', era: 'Various' },
  { value: 'HDPE', label: 'HDPE', era: '1990s-Present' },
  { value: 'UNKNOWN', label: 'Unknown', era: '' },
] as const;

export const CONDITION_RATINGS = [
  { value: 'GOOD', label: 'Good', color: 'green', description: 'No significant issues found' },
  { value: 'FAIR', label: 'Fair', color: 'yellow', description: 'Minor issues, monitoring recommended' },
  { value: 'NEEDS_ATTENTION', label: 'Needs Attention', color: 'orange', description: 'Issues found requiring repair' },
  { value: 'CRITICAL', label: 'Critical', color: 'red', description: 'Immediate action required' },
] as const;

export const URGENCY_LEVELS = [
  { value: 'NONE', label: 'None', description: 'No action needed' },
  { value: 'MONITOR', label: 'Monitor', description: 'Keep an eye on, reassess in 1-2 years' },
  { value: 'SOON', label: 'Address Soon', description: 'Should be repaired within 60-90 days' },
  { value: 'IMMEDIATE', label: 'Immediate', description: 'Requires urgent professional attention' },
] as const;

export const DEFECT_TYPES = [
  { id: 'root_intrusion', label: 'Root Intrusion', icon: 'TreeDeciduous' },
  { id: 'crack', label: 'Crack/Fracture', icon: 'Slash' },
  { id: 'belly', label: 'Belly/Sag', icon: 'TrendingDown' },
  { id: 'offset', label: 'Offset Joint', icon: 'ArrowLeftRight' },
  { id: 'blockage', label: 'Blockage', icon: 'Ban' },
  { id: 'grease', label: 'Grease Buildup', icon: 'Droplet' },
  { id: 'corrosion', label: 'Corrosion', icon: 'Circle' },
  { id: 'collapse', label: 'Collapse', icon: 'AlertTriangle' },
] as const;

export const SEVERITY_LEVELS = [
  { value: 'minor', label: 'Minor', color: 'yellow' },
  { value: 'moderate', label: 'Moderate', color: 'orange' },
  { value: 'severe', label: 'Severe', color: 'red' },
] as const;

export const CLIENT_ROLES = [
  { value: 'HOMEOWNER', label: 'Homeowner' },
  { value: 'BUYER', label: 'Buyer' },
  { value: 'SELLER', label: 'Seller' },
  { value: 'REALTOR', label: 'Realtor' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const ACCESS_TYPES = [
  { value: 'CLEANOUT', label: 'Standard Cleanout', fee: 0 },
  { value: 'ROOF_VENT', label: 'Roof Vent', fee: 50 },
  { value: 'TOILET_PULL', label: 'Toilet Pull & Reset', fee: 250 },
  { value: 'UNKNOWN', label: 'To Be Determined', fee: 0 },
] as const;

// Pre-inspection interview fields
export const PRE_INSPECTION_FIELDS = [
  { id: 'confirmedClientName', label: 'Client Name', required: true, type: 'text' },
  { id: 'confirmedAddress', label: 'Property Address', required: true, type: 'text' },
  { id: 'homeAge', label: 'Home Age (Approximate)', required: true, type: 'text' },
  { id: 'pipeMaterial', label: 'Pipe Material', required: true, type: 'select', options: PIPE_MATERIALS },
  { id: 'knownIssues', label: 'Known Sewer Issues', required: true, type: 'textarea' },
  { id: 'backupHistory', label: 'Backup/Slow Drain History', required: true, type: 'textarea' },
  { id: 'recentWork', label: 'Recent Plumbing Work', required: false, type: 'textarea' },
  { id: 'specialInstructions', label: 'Special Notes', required: false, type: 'textarea' },
] as const;

// Post-inspection findings fields
export const POST_INSPECTION_FIELDS = [
  { id: 'overallCondition', label: 'Overall Condition', required: true, type: 'rating' },
  { id: 'pipeConditionRating', label: 'Pipe Condition (1-5)', required: true, type: 'number', min: 1, max: 5 },
  { id: 'connectionToMain', label: 'Connection to Main', required: true, type: 'select', options: ['Verified', 'Not Accessible', 'Issues Found'] },
  { id: 'recommendations', label: 'Recommendations', required: true, type: 'textarea' },
  { id: 'urgencyLevel', label: 'Urgency Level', required: true, type: 'select', options: URGENCY_LEVELS },
] as const;

// Minimum inspection duration in minutes
export const MIN_INSPECTION_DURATION = 15;

// GPS accuracy threshold in meters
export const GPS_ACCURACY_THRESHOLD = 150;

// Download link settings
export const DOWNLOAD_LINK_HOURS = 72;
export const DOWNLOAD_LINK_GRACE_HOURS = 24;
export const MAX_DOWNLOADS = 3;
