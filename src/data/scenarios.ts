import type { CityId, Incident, ScenarioDefinition, ScenarioId } from "../types/crisis";

const incident = (
  id: string,
  type: Incident["type"],
  title: string,
  lat: number,
  lng: number,
  severity: number,
  peopleAffected: number,
  urgency: Incident["urgency"],
  requiredResources: Incident["requiredResources"],
): Incident => ({
  id,
  type,
  title,
  location: { lat, lng },
  severity,
  baseSeverity: severity,
  peopleAffected,
  urgency,
  requiredResources,
  status: "open",
  coveredPeople: 0,
});

const byCity = (scenario: ScenarioId): Record<CityId, Incident[]> => {
  if (scenario === "central-flood") {
    return {
      singapore: [
        incident("sg-flood-1", "flood", "Central canal overflow", 1.2868, 103.8545, 82, 540, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("sg-flood-2", "flood", "Kallang evacuation zone", 1.3106, 103.8666, 69, 390, "high", {
          supply: 1,
          volunteer: 1,
          food: 1,
        }),
        incident("sg-med-1", "medical", "Elderly care medical surge", 1.3323, 103.8462, 58, 170, "high", {
          ambulance: 1,
          medical: 1,
        }),
      ],
      "new-york": [
        incident("ny-flood-1", "flood", "Lower Manhattan storm surge", 40.7074, -74.0113, 86, 780, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("ny-flood-2", "flood", "Red Hook evacuation zone", 40.6784, -74.0117, 72, 430, "high", {
          supply: 1,
          volunteer: 1,
          food: 1,
        }),
        incident("ny-med-1", "medical", "Senior housing medical surge", 40.744, -73.99, 61, 210, "high", {
          ambulance: 1,
          medical: 1,
        }),
      ],
      london: [
        incident("ldn-flood-1", "flood", "Westminster river breach", 51.501, -0.1246, 84, 620, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("ldn-flood-2", "flood", "Southbank flood sheltering", 51.506, -0.111, 68, 360, "high", {
          supply: 1,
          volunteer: 1,
          food: 1,
        }),
        incident("ldn-med-1", "medical", "Care home triage spike", 51.5156, -0.0919, 59, 190, "high", {
          ambulance: 1,
          medical: 1,
        }),
      ],
    };
  }

  if (scenario === "hospital-fire") {
    return {
      singapore: [
        incident("sg-fire-1", "fire", "Hospital wing evacuation", 1.3213, 103.8464, 88, 260, "critical", {
          ambulance: 2,
          medical: 2,
          volunteer: 1,
        }),
        incident("sg-med-2", "medical", "Overflow triage at Novena", 1.3199, 103.843, 75, 220, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
        }),
        incident("sg-power-1", "blackout", "Backup generator load failure", 1.315, 103.8505, 53, 120, "medium", {
          power: 1,
        }),
      ],
      "new-york": [
        incident("ny-fire-1", "fire", "Hospital smoke evacuation", 40.7394, -73.976, 87, 300, "critical", {
          ambulance: 2,
          medical: 2,
          volunteer: 1,
        }),
        incident("ny-med-2", "medical", "Overflow triage at Kips Bay", 40.7426, -73.9816, 76, 240, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
        }),
        incident("ny-power-1", "blackout", "Generator instability zone", 40.736, -73.986, 55, 135, "medium", {
          power: 1,
        }),
      ],
      london: [
        incident("ldn-fire-1", "fire", "Hospital wing fire evacuation", 51.519, -0.059, 88, 280, "critical", {
          ambulance: 2,
          medical: 2,
          volunteer: 1,
        }),
        incident("ldn-med-2", "medical", "Whitechapel overflow triage", 51.517, -0.066, 77, 230, "critical", {
          ambulance: 1,
          medical: 1,
          supply: 1,
        }),
        incident("ldn-power-1", "blackout", "Backup power instability", 51.522, -0.049, 54, 130, "medium", {
          power: 1,
        }),
      ],
    };
  }

  if (scenario === "residential-blackout") {
    return {
      singapore: [
        incident("sg-outage-1", "blackout", "Tampines residential outage", 1.3529, 103.9447, 79, 830, "critical", {
          power: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("sg-outage-2", "blackout", "Serangoon lift entrapments", 1.3554, 103.8679, 66, 260, "high", {
          ambulance: 1,
          power: 1,
        }),
        incident("sg-food-1", "flood", "Cold-chain food support", 1.3753, 103.9534, 46, 180, "medium", {
          food: 1,
          volunteer: 1,
        }),
      ],
      "new-york": [
        incident("ny-outage-1", "blackout", "Queens residential blackout", 40.742, -73.769, 80, 920, "critical", {
          power: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("ny-outage-2", "blackout", "Elevator rescue cluster", 40.758, -73.92, 65, 310, "high", {
          ambulance: 1,
          power: 1,
        }),
        incident("ny-food-1", "flood", "Cold-chain food support", 40.6501, -73.9496, 48, 205, "medium", {
          food: 1,
          volunteer: 1,
        }),
      ],
      london: [
        incident("ldn-outage-1", "blackout", "Stratford residential outage", 51.542, -0.003, 79, 780, "critical", {
          power: 1,
          supply: 1,
          volunteer: 1,
        }),
        incident("ldn-outage-2", "blackout", "Camden lift rescue cluster", 51.539, -0.142, 64, 250, "high", {
          ambulance: 1,
          power: 1,
        }),
        incident("ldn-food-1", "flood", "Cold-chain food support", 51.467, -0.119, 47, 185, "medium", {
          food: 1,
          volunteer: 1,
        }),
      ],
    };
  }

  if (scenario === "haze-medical") {
    return {
      singapore: [
        incident("sg-haze-1", "haze", "Respiratory demand spike", 1.3343, 103.8502, 81, 450, "critical", {
          medical: 2,
          ambulance: 1,
          supply: 1,
        }),
        incident("sg-haze-2", "haze", "School shelter air quality alert", 1.3001, 103.8495, 62, 380, "high", {
          volunteer: 1,
          supply: 1,
        }),
        incident("sg-med-3", "medical", "Asthma triage queue", 1.352, 103.82, 67, 210, "high", {
          medical: 1,
          ambulance: 1,
        }),
      ],
      "new-york": [
        incident("ny-haze-1", "haze", "Wildfire smoke medical surge", 40.757, -74.002, 80, 520, "critical", {
          medical: 2,
          ambulance: 1,
          supply: 1,
        }),
        incident("ny-haze-2", "haze", "School clean-air shelter", 40.725, -73.945, 63, 410, "high", {
          volunteer: 1,
          supply: 1,
        }),
        incident("ny-med-3", "medical", "Asthma triage queue", 40.713, -74.006, 66, 250, "high", {
          medical: 1,
          ambulance: 1,
        }),
      ],
      london: [
        incident("ldn-haze-1", "haze", "Air quality medical surge", 51.506, -0.116, 78, 390, "critical", {
          medical: 2,
          ambulance: 1,
          supply: 1,
        }),
        incident("ldn-haze-2", "haze", "School clean-air shelter", 51.53, -0.102, 61, 340, "high", {
          volunteer: 1,
          supply: 1,
        }),
        incident("ldn-med-3", "medical", "Asthma triage queue", 51.507, -0.128, 65, 225, "high", {
          medical: 1,
          ambulance: 1,
        }),
      ],
    };
  }

  return {
    singapore: [
      incident("sg-multi-1", "flood", "Marina flood evacuation", 1.2868, 103.8545, 88, 620, "critical", {
        ambulance: 1,
        medical: 1,
        supply: 1,
        volunteer: 1,
      }),
      incident("sg-multi-2", "fire", "Depot fire exposure", 1.3532, 103.8895, 73, 190, "high", {
        ambulance: 1,
        medical: 1,
      }),
      incident("sg-multi-3", "blackout", "East power failure", 1.3527, 103.9447, 69, 520, "high", {
        power: 1,
        supply: 1,
      }),
      incident("sg-multi-4", "medical", "Mass triage backlog", 1.3212, 103.8464, 76, 280, "critical", {
        ambulance: 1,
        medical: 1,
      }),
      incident("sg-multi-5", "haze", "Respiratory shelter demand", 1.3343, 103.8502, 58, 260, "medium", {
        food: 1,
        volunteer: 1,
      }),
    ],
    "new-york": [
      incident("ny-multi-1", "flood", "Financial District flooding", 40.7074, -74.0113, 89, 810, "critical", {
        ambulance: 1,
        medical: 1,
        supply: 1,
        volunteer: 1,
      }),
      incident("ny-multi-2", "fire", "Brooklyn warehouse fire", 40.6782, -73.9442, 74, 230, "high", {
        ambulance: 1,
        medical: 1,
      }),
      incident("ny-multi-3", "blackout", "Queens feeder outage", 40.7421, -73.7694, 70, 610, "high", {
        power: 1,
        supply: 1,
      }),
      incident("ny-multi-4", "medical", "Midtown triage backlog", 40.7549, -73.984, 78, 310, "critical", {
        ambulance: 1,
        medical: 1,
      }),
      incident("ny-multi-5", "haze", "Clean-air shelter demand", 40.7571, -74.0026, 57, 290, "medium", {
        food: 1,
        volunteer: 1,
      }),
    ],
    london: [
      incident("ldn-multi-1", "flood", "Thames flood evacuation", 51.501, -0.1246, 88, 680, "critical", {
        ambulance: 1,
        medical: 1,
        supply: 1,
        volunteer: 1,
      }),
      incident("ldn-multi-2", "fire", "East depot fire exposure", 51.5194, -0.0598, 73, 210, "high", {
        ambulance: 1,
        medical: 1,
      }),
      incident("ldn-multi-3", "blackout", "Stratford power failure", 51.5423, -0.0026, 70, 560, "high", {
        power: 1,
        supply: 1,
      }),
      incident("ldn-multi-4", "medical", "Central triage backlog", 51.5155, -0.0922, 77, 270, "critical", {
        ambulance: 1,
        medical: 1,
      }),
      incident("ldn-multi-5", "haze", "Clean-air shelter demand", 51.5067, -0.1164, 56, 245, "medium", {
        food: 1,
        volunteer: 1,
      }),
    ],
  };
};

export const scenarios: ScenarioDefinition[] = [
  {
    id: "central-flood",
    name: "Central District Flood",
    description: "Urban flood response with evacuations, triage, and relief logistics.",
    trackFit: ["Smart Cities", "Sustainable Technology", "Social Impact"],
    incidents: byCity("central-flood"),
  },
  {
    id: "hospital-fire",
    name: "Hospital Fire Surge",
    description: "A hospital evacuation creates ambulance, medical, and overflow capacity pressure.",
    trackFit: ["HealthTech", "Smart Cities"],
    incidents: byCity("hospital-fire"),
  },
  {
    id: "residential-blackout",
    name: "Residential Blackout",
    description: "Power outages create welfare checks, lift rescues, and supply needs.",
    trackFit: ["Smart Cities", "Sustainable Technology"],
    incidents: byCity("residential-blackout"),
  },
  {
    id: "haze-medical",
    name: "Haze Medical Spike",
    description: "Air quality deterioration drives respiratory cases and shelter demand.",
    trackFit: ["AI/ML", "HealthTech", "Sustainable Technology"],
    incidents: byCity("haze-medical"),
  },
  {
    id: "multi-incident",
    name: "Downtown Multi-Incident Crisis",
    description: "A compound crisis stresses routing, triage, sheltering, logistics, and power.",
    trackFit: ["Smart Cities", "AI/ML", "Open Innovation"],
    incidents: byCity("multi-incident"),
  },
];

export const getScenarioById = (id: ScenarioId) =>
  scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
