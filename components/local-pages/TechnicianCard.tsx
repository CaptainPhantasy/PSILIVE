// ============================================================================
// Technician Card Component
// Displays technician profiles
// ============================================================================

import { TechnicianProfile } from '@prisma/client';

interface TechnicianCardProps {
  technician: TechnicianProfile;
}

export default function TechnicianCard({ technician }: TechnicianCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          {technician.photoUrl ? (
            <img
              src={technician.photoUrl}
              alt={technician.photoAlt || technician.bio.substring(0, 50)}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {technician.bio.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-gray-900 truncate">
            {technician.shortBio || 'Technician'}
          </h3>
          {technician.title && (
            <p className="text-sm text-primary-600 mb-2">
              {technician.title}
            </p>
          )}
          {technician.yearsExperience && (
            <p className="text-sm text-gray-500">
              {technician.yearsExperience}+ years experience
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {technician.shortBio && (
        <p className="mt-4 text-sm text-gray-600 line-clamp-3">
          {technician.shortBio}
        </p>
      )}

      {/* Certifications */}
      {technician.certifications && technician.certifications.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {technician.certifications.slice(0, 3).map((cert, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {cert}
            </span>
          ))}
          {technician.certifications.length > 3 && (
            <span className="text-xs text-gray-500">
              +{technician.certifications.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
