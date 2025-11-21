import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../theme/ThemeContext';

export interface LightingPreset {
    id: string;
    name: string;
    icon: string;
    description: string;
    config: {
        sun: { intensity: number; color: string; position: [number, number, number] };
        ambient: { intensity: number; color: string };
        fog?: { enabled: boolean; density: number; color: string };
    };
}

const PRESETS: LightingPreset[] = [
    {
        id: 'golden_hour',
        name: 'Golden Hour',
        icon: '🌅',
        description: 'Warm sunset lighting',
        config: {
            sun: { intensity: 1.2, color: '#FFB366', position: [50, 20, 50] },
            ambient: { intensity: 0.4, color: '#FFA366' },
            fog: { enabled: true, density: 0.008, color: '#FFB366' }
        }
    },
    {
        id: 'overcast',
        name: 'Overcast',
        icon: '☁️',
        description: 'Soft diffused lighting',
        config: {
            sun: { intensity: 0.6, color: '#E0E0E0', position: [0, 100, 0] },
            ambient: { intensity: 0.8, color: '#B0B0B0' },
            fog: { enabled: true, density: 0.015, color: '#CCCCCC' }
        }
    },
    {
        id: 'night',
        name: 'Night',
        icon: '🌙',
        description: 'Cool moonlight',
        config: {
            sun: { intensity: 0.3, color: '#4A90E2', position: [100, 80, -50] },
            ambient: { intensity: 0.15, color: '#1A2A4A' },
            fog: { enabled: true, density: 0.02, color: '#0A1A2A' }
        }
    },
    {
        id: 'studio',
        name: 'Studio',
        icon: '💡',
        description: 'Neutral studio lighting',
        config: {
            sun: { intensity: 1.0, color: '#FFFFFF', position: [50, 50, 50] },
            ambient: { intensity: 0.6, color: '#F0F0F0' },
            fog: { enabled: false, density: 0, color: '#FFFFFF' }
        }
    },
    {
        id: 'dawn',
        name: 'Dawn',
        icon: '🌄',
        description: 'Cool morning light',
        config: {
            sun: { intensity: 0.8, color: '#FFE4B3', position: [-50, 30, 50] },
            ambient: { intensity: 0.3, color: '#B3D9FF' },
            fog: { enabled: true, density: 0.012, color: '#E6F0FF' }
        }
    },
    {
        id: 'noir',
        name: 'Film Noir',
        icon: '🎬',
        description: 'High contrast dramatic',
        config: {
            sun: { intensity: 1.5, color: '#FFFFFF', position: [100, 60, -30] },
            ambient: { intensity: 0.1, color: '#1A1A1A' },
            fog: { enabled: true, density: 0.025, color: '#000000' }
        }
    }
];

interface LightingPresetsProps {
    onApplyPreset: (preset: LightingPreset) => void;
    currentPresetId?: string;
}

const LightingPresets: React.FC<LightingPresetsProps> = ({ onApplyPreset, currentPresetId }) => {
    const { colors } = useTheme();
    const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

    return (
        <div className="rounded-xl p-4 border backdrop-blur-md"
            style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderColor: colors.border_primary
            }}>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider"
                style={{ color: colors.text_secondary }}>
                Lighting Presets
            </h3>

            <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => {
                    const isActive = currentPresetId === preset.id;
                    const isHovered = hoveredPreset === preset.id;

                    return (
                        <motion.button
                            key={preset.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onApplyPreset(preset)}
                            onMouseEnter={() => setHoveredPreset(preset.id)}
                            onMouseLeave={() => setHoveredPreset(null)}
                            className="p-3 rounded-lg border transition-all text-left"
                            style={{
                                backgroundColor: isActive
                                    ? 'rgba(255,215,0,0.15)'
                                    : isHovered
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(255,255,255,0.03)',
                                borderColor: isActive ? colors.accent_primary : colors.border_tertiary
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{preset.icon}</span>
                                <span className="text-sm font-medium" style={{ color: colors.text_primary }}>
                                    {preset.name}
                                </span>
                            </div>
                            <p className="text-xs opacity-70" style={{ color: colors.text_tertiary }}>
                                {preset.description}
                            </p>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default LightingPresets;
export { PRESETS };
