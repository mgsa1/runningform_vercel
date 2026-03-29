import Link from 'next/link'

const metrics = [
  {
    name: 'Vertical Oscillation',
    unit: '% of estimated body height (shoulder-to-ankle distance)',
    thresholds: {
      easy: '< 5.5% good, < 8.0% moderate',
      tempo: '< 6.0% good, < 8.5% moderate',
      fast: '< 6.5% good, < 9.0% moderate',
    },
    methodology:
      'Computed as the total range (max minus min) of hip-to-ankle vertical distance across all analyzed frames, divided by the average shoulder-to-ankle distance. Using hip-minus-ankle cancels vertical camera panning. This total-range method yields higher values than per-stride averages reported by wearables like Garmin.',
    caveats: [
      '"% of body height" is not a standard metric in the literature or wearable ecosystem. Garmin and Stryd use absolute centimeters or vertical ratio (VO / stride length). This is a novel normalization designed for camera-independence.',
      'Body height is estimated as shoulder-to-ankle distance, which is ~75-80% of true height. This inflates percentages ~25% compared to true body height.',
    ],
    sources: [
      {
        text: 'Moore 2016 — "Is There an Economical Running Technique?" Sports Medicine, 46, 793-807',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4887549/',
        finding: 'Lower vertical oscillation is beneficial for running economy, though few studies have manipulated VO as an independent variable.',
      },
      {
        text: 'Adams et al. 2018 — "Altering Cadence or Vertical Oscillation During Running." IJSPT, 13(4), 633-642',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6088121/',
        finding: '5-10 cm vertical oscillation promoted proper running form and may mitigate injury risk.',
      },
      {
        text: 'Roche-Seruendo et al. 2024 — Systematic review and meta-analysis. Sports Medicine, 54, 1269-1316',
        url: 'https://link.springer.com/article/10.1007/s40279-024-01997-3',
        finding: 'Higher vertical oscillation moderately associated with higher energetic cost (r = 0.35).',
      },
      {
        text: 'Garmin Running Dynamics — Vertical Oscillation',
        url: 'https://www.garmin.com/en-US/garmin-technology/running-science/running-dynamics/vertical-oscillation/',
        finding: 'Color zones: excellent < 6.8 cm, good 6.8-8.9 cm, fair 9.0-10.9 cm, poor 11.0-13.0 cm.',
      },
    ],
  },
  {
    name: 'Trunk Lean',
    unit: 'degrees forward from vertical',
    thresholds: {
      easy: '2-8° good, 0-12° moderate',
      tempo: '3-9° good, 1-13° moderate',
      fast: '3-10° good, 1-15° moderate',
    },
    methodology:
      'Computed as the angle from vertical of the line connecting shoulder midpoint to hip midpoint, averaged across all frames with valid pose landmarks. Lean source (ankles vs. waist) is determined by comparing upper-body lean to lower-body lean.',
    caveats: [
      'Contrary to popular coaching advice, elite runners do NOT increase lean with speed. The assumption that "faster = more lean" appears to be a recreational runner habit, not an elite characteristic.',
      'There is a trade-off: more lean reduces knee load but increases hip extensor demand (Teng & Powers 2015). The "right" amount depends on individual injury history.',
    ],
    sources: [
      {
        text: 'Preece et al. 2016 — "How do elite endurance runners alter movements of the spine and pelvis as running speed increases?" Gait & Posture',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0966636216000862',
        finding: 'Elite runners maintained ~3° lean across all speeds (12-20 km/h). Recreational runners increased from ~5° to ~7.5°.',
      },
      {
        text: 'Williams & Cavanagh 1987 — "Relationship between distance running mechanics, running economy, and performance." J. Applied Physiology, 63, 1236-1245',
        url: 'https://pubmed.ncbi.nlm.nih.gov/3654469/',
        finding: 'Most economical group ran with ~5.9° trunk flexion; least economical at ~2.4°.',
      },
      {
        text: 'Carson, Aslan & Ortega 2024 — "The effect of forward postural lean on running economy." PLOS ONE, 19(5)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11135760/',
        finding: 'Running at ~8° lean increased metabolic cost by 8% vs. upright.',
      },
      {
        text: 'Folland et al. 2017 — "Running Technique is an Important Component of Running Economy and Performance." MSSE, 49(7)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5473370/',
        finding: 'More upright trunk posture correlated with better performance across 97 endurance runners.',
      },
      {
        text: 'Teng & Powers 2015 — "Influence of trunk posture on lower extremity energetics during running." MSSE, 47(3)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25003780/',
        finding: 'Increasing trunk flexion by ~7° reduced knee extension moment by ~7% but increased hip extensor demand.',
      },
    ],
  },
  {
    name: 'Foot Placement',
    unit: '% of estimated body height (shoulder-to-ankle distance)',
    thresholds: {
      easy: '< 5% good, < 9% moderate',
      tempo: '< 7% good, < 11% moderate',
      fast: '< 9% good, < 13% moderate',
    },
    methodology:
      'Computed as the absolute horizontal distance between hip midpoint and the visible-side ankle at ground contact frames, divided by the shoulder-to-ankle body height estimate. Expressed as a percentage.',
    caveats: [
      'No validated cutoff values exist in the literature (Souza 2016: "likely on a sliding scale, where lower values are generally associated with lower ground reaction forces"). Our thresholds are derived empirically.',
      'The horizontal/vertical coordinate ratio introduces a constant scaling factor dependent on video aspect ratio (~0.56x for 16:9 landscape). Thresholds are calibrated for typical phone landscape video.',
      '2D side-view video has significant limitations for this measurement. Shank angle at touchdown (tibia angle from vertical) is a more robust, camera-independent metric used in clinical settings.',
    ],
    sources: [
      {
        text: 'Lieberman et al. 2015 — "Effects of stride frequency and foot position at landing on braking force." J. Experimental Biology, 218(21), 3406-3414',
        url: 'https://journals.biologists.com/jeb/article/218/21/3406/14416/',
        finding: 'Overstriding results from foot position relative to COM, creating braking impulse proportional to foot-ahead distance.',
      },
      {
        text: 'Hanley et al. 2020 — "Men\'s and Women\'s World Championship Marathon Performances." Frontiers in Sports and Active Living, 2:102',
        url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00102/full',
        finding: 'Elite marathoners land ~0.30 m ahead of COM. Rearfoot vs. non-rearfoot difference was only 0.03-0.04 m — described as "too small to be meaningful."',
      },
      {
        text: 'Heiderscheit, Schubert & Kempf 2014 — "Influence of Stride Frequency and Length on Running Mechanics: A Systematic Review." Sports Health',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4000471/',
        finding: 'Every +5 strides/min cadence increase reduced foot-ahead position by ~5.9%.',
      },
      {
        text: 'Souza 2016 — "An Evidence-Based Videotaped Running Biomechanics Analysis." Physical Therapy in Sport',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4714754/',
        finding: '"There are no cutoffs at which this distance is determined to be abnormal."',
      },
      {
        text: 'Napier et al. 2024 — "Predicting overstriding with wearable IMUs." Scientific Reports',
        url: 'https://www.nature.com/articles/s41598-024-56888-4',
        finding: 'Defines overstriding as horizontal distance between greater trochanter and lateral malleolus at foot contact.',
      },
    ],
  },
  {
    name: 'Contact Time Asymmetry',
    unit: '% difference between left and right ground contact time',
    thresholds: {
      all: '< 3% good, < 6% moderate, > 6% significant',
    },
    methodology:
      'Computed from ground contact time estimates for left and right foot strikes detected via gait cycle analysis. Expressed as the percentage difference between sides.',
    caveats: [
      'Asymmetry does NOT reliably predict injury. The largest prospective study on this topic (Malisoux et al. 2024, n=836) found no association between gait asymmetry and running-related injury risk. We frame asymmetry as a running economy concern only.',
      'Our measurement uses 2D pose estimation from a single side-view camera, which limits accuracy for bilateral comparisons.',
    ],
    sources: [
      {
        text: 'Vincent et al. 2025 — "Reference biomechanical parameters and natural asymmetry." Frontiers in Sports and Active Living',
        url: 'https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1560756/full',
        finding: 'Healthy injury-free runners (n=250) show < 4% spatiotemporal asymmetry across all age groups.',
      },
      {
        text: 'Joubert et al. 2020 — "Ground Contact Time Imbalances Strongly Related to Impaired Running Economy." IJSE, 13(4), 427-437',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7241633/',
        finding: '~3.7% increase in metabolic cost for every 1% increase in GCT imbalance (R-squared > 0.65).',
      },
      {
        text: 'Malisoux et al. 2024 — "Gait asymmetry does not increase running-related injury risk in lower limbs." BMJ Open Sport and Exercise Medicine',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10773390/',
        finding: 'Prospective study of 836 recreational runners: asymmetry was NOT associated with higher injury risk. Greater flight time asymmetry was associated with lower injury risk.',
      },
      {
        text: 'Garmin Running Dynamics — GCT Balance',
        url: 'https://www.garmin.com/en-US/garmin-technology/running-science/running-dynamics/ground-contact-time-balance/',
        finding: '"Good" balance = 49.3-50.7% (~1.4% asymmetry).',
      },
    ],
  },
]

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-10">
        <div className="space-y-3">
          <h1 className="font-heading text-2xl font-bold">Research Basis</h1>
          <p className="text-sm text-[#888888] leading-relaxed">
            RunningForm uses biomechanics reference ranges derived from peer-reviewed
            sports science research. This page documents the evidence behind each metric,
            our measurement methodology, and known limitations. We believe in transparency
            about what the science supports and where our analysis is approximate.
          </p>
          <p className="text-sm text-[#888888] leading-relaxed">
            All biomechanics measurements are computed client-side from 2D video using
            MediaPipe Pose Landmarker. They are estimates, not lab-grade measurements.
            Reference ranges are pace-adjusted across three tiers: easy (&gt; 6:00/km),
            tempo (4:30-6:00/km), and fast (&lt; 4:30/km).
          </p>
        </div>

        {metrics.map((metric) => (
          <section
            key={metric.name}
            className="border border-[#1A1A1A] bg-[#0A0A0A] p-5 space-y-5"
          >
            <h2 className="text-lg font-semibold text-white">{metric.name}</h2>

            {/* Unit */}
            <div className="text-xs text-[#444444]">
              Unit: {metric.unit}
            </div>

            {/* Thresholds */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-[#888888]">Thresholds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {Object.entries(metric.thresholds).map(([pace, range]) => (
                  <div
                    key={pace}
                    className="bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2 text-xs"
                  >
                    <span className="text-[#888888] capitalize">{pace}: </span>
                    <span className="text-white">{range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Methodology */}
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-[#888888]">How we measure it</h3>
              <p className="text-sm text-[#888888] leading-relaxed">
                {metric.methodology}
              </p>
            </div>

            {/* Caveats */}
            {metric.caveats.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-amber-400">Limitations</h3>
                <ul className="space-y-1.5">
                  {metric.caveats.map((caveat, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-[#888888] leading-relaxed"
                    >
                      <span className="text-amber-500 shrink-0 mt-0.5">*</span>
                      {caveat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sources */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[#888888]">Sources</h3>
              <ul className="space-y-3">
                {metric.sources.map((source, i) => (
                  <li key={i} className="text-sm space-y-0.5">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#888888] hover:text-white transition-colors underline underline-offset-2"
                    >
                      {source.text}
                    </a>
                    <p className="text-[#444444] text-xs pl-4">
                      {source.finding}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}

        {/* Disclaimer */}
        <p className="text-xs text-[#444444] leading-relaxed border-t border-[#1A1A1A] pt-6">
          This analysis is AI-generated and intended for educational purposes only. It is not a
          substitute for advice from a qualified running coach or physiotherapist. Biomechanics
          metrics are estimates from 2D side-view video, not lab-grade measurements.
        </p>

        <div className="pb-4">
          <Link
            href="/upload"
            className="text-sm text-[#888888] hover:text-white transition-colors"
          >
            ← Back to upload
          </Link>
        </div>
      </div>
    </div>
  )
}
