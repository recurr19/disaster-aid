import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, TrendingUp, AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface Brief {
  timestamp: string;
  summary: string;
  metrics: {
    unmetRequests: number;
    sosRequests: number;
    shelterOccupancy: number;
    activeTeams: number;
    criticalZones: string[];
    resourceGaps: string[];
    recommendations: string[];
  };
}

export default function AutomatedBriefs() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBriefs();
  }, []);

  const loadBriefs = async () => {
    const storedBriefs = localStorage.getItem('authority_briefs');
    if (storedBriefs) {
      setBriefs(JSON.parse(storedBriefs));
    }
    setLoading(false);
  };

  const generateBrief = async () => {
    setGenerating(true);
    try {
      const [requestsRes, sheltersRes, teamsRes] = await Promise.all([
        supabase.from('requests').select('*'),
        supabase.from('shelters').select('*'),
        supabase.from('authority_teams').select('*').eq('status', 'available'),
      ]);

      const requests = requestsRes.data || [];
      const shelters = sheltersRes.data || [];
      const availableTeams = teamsRes.data || [];

      const unmetRequests = requests.filter(r => r.status === 'new' || r.status === 'triaged');
      const sosRequests = requests.filter(r => r.is_sos && (r.status === 'new' || r.status === 'triaged'));

      const totalCapacity = shelters.reduce((sum, s) => sum + s.total_capacity, 0);
      const totalOccupancy = shelters.reduce((sum, s) => sum + s.current_occupancy, 0);
      const shelterOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

      const categoryBreakdown: Record<string, number> = {};
      unmetRequests.forEach(req => {
        req.need_categories.forEach((cat: string) => {
          categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        });
      });

      const topNeeds = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      const criticalZones: string[] = [];
      const zoneRequests: Record<string, number> = {};
      unmetRequests.forEach(req => {
        const zone = req.location_address?.split(',')[0] || 'Unknown';
        zoneRequests[zone] = (zoneRequests[zone] || 0) + 1;
      });

      Object.entries(zoneRequests).forEach(([zone, count]) => {
        if (count > 10) {
          criticalZones.push(`${zone} (${count} requests)`);
        }
      });

      const resourceGaps: string[] = [];
      const recommendations: string[] = [];

      topNeeds.forEach(([category, count]) => {
        if (count > 20) {
          resourceGaps.push(`${category}: ${count} unmet requests`);
          recommendations.push(`Deploy additional ${category} distribution teams`);
        }
      });

      if (shelterOccupancyPercent > 80) {
        resourceGaps.push(`Shelter capacity at ${shelterOccupancyPercent}%`);
        recommendations.push('Consider opening additional shelters or evacuation centers');
      }

      if (sosRequests.length > 5) {
        resourceGaps.push(`${sosRequests.length} urgent SoS requests pending`);
        recommendations.push('Prioritize SoS queue - deploy rescue and medical teams immediately');
      }

      if (availableTeams.length < 3) {
        resourceGaps.push(`Only ${availableTeams.length} teams available`);
        recommendations.push('Request additional team resources from neighboring districts');
      }

      let summaryText = `Crisis Update: ${unmetRequests.length} unmet requests across the region. `;

      if (sosRequests.length > 0) {
        summaryText += `${sosRequests.length} urgent SoS cases require immediate attention. `;
      }

      if (topNeeds.length > 0) {
        summaryText += `Top needs: ${topNeeds.map(([cat, count]) => `${cat} (${count})`).join(', ')}. `;
      }

      if (shelterOccupancyPercent > 75) {
        summaryText += `Shelter occupancy at ${shelterOccupancyPercent}%. `;
      }

      if (criticalZones.length > 0) {
        summaryText += `High demand zones: ${criticalZones.slice(0, 2).join(', ')}. `;
      }

      if (recommendations.length > 0) {
        summaryText += `Recommended actions: ${recommendations.slice(0, 2).join('; ')}.`;
      }

      const newBrief: Brief = {
        timestamp: new Date().toISOString(),
        summary: summaryText,
        metrics: {
          unmetRequests: unmetRequests.length,
          sosRequests: sosRequests.length,
          shelterOccupancy: shelterOccupancyPercent,
          activeTeams: availableTeams.length,
          criticalZones,
          resourceGaps,
          recommendations,
        },
      };

      const updatedBriefs = [newBrief, ...briefs].slice(0, 10);
      setBriefs(updatedBriefs);
      localStorage.setItem('authority_briefs', JSON.stringify(updatedBriefs));

      await supabase.from('activity_logs').insert({
        action_type: 'brief_generated',
        entity_type: 'system',
        entity_id: null,
        performed_by: 'Authority Control',
        details: { brief: newBrief },
      });

      setGenerating(false);
    } catch (error) {
      console.error('Error generating brief:', error);
      setGenerating(false);
    }
  };

  const exportBrief = (brief: Brief) => {
    const content = `
DISASTER AID - AUTHORITY BRIEF
Generated: ${new Date(brief.timestamp).toLocaleString()}

EXECUTIVE SUMMARY
${brief.summary}

KEY METRICS
- Unmet Requests: ${brief.metrics.unmetRequests}
- SoS Urgent Cases: ${brief.metrics.sosRequests}
- Shelter Occupancy: ${brief.metrics.shelterOccupancy}%
- Available Teams: ${brief.metrics.activeTeams}

CRITICAL ZONES
${brief.metrics.criticalZones.map(zone => `- ${zone}`).join('\n')}

RESOURCE GAPS IDENTIFIED
${brief.metrics.resourceGaps.map(gap => `- ${gap}`).join('\n')}

RECOMMENDED ACTIONS
${brief.metrics.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authority-brief-${new Date(brief.timestamp).toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automated Authority Briefs</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-generated strategic summaries for crisis management decision-making
          </p>
        </div>
        <button
          onClick={generateBrief}
          disabled={generating}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {generating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span>Generate New Brief</span>
            </>
          )}
        </button>
      </div>

      {briefs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Briefs Available</h3>
          <p className="text-gray-600 mb-4">Generate your first authority brief to get started</p>
          <button
            onClick={generateBrief}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Generate Brief Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Authority Brief #{briefs.length - index}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(brief.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => exportBrief(brief)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4">
                <p className="text-sm text-gray-900 leading-relaxed">{brief.summary}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Unmet Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{brief.metrics.unmetRequests}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">SoS Urgent</p>
                  <p className="text-2xl font-bold text-red-900">{brief.metrics.sosRequests}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-purple-600 mb-1">Shelter Occupancy</p>
                  <p className="text-2xl font-bold text-purple-900">{brief.metrics.shelterOccupancy}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-600 mb-1">Available Teams</p>
                  <p className="text-2xl font-bold text-green-900">{brief.metrics.activeTeams}</p>
                </div>
              </div>

              {brief.metrics.criticalZones.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                    Critical Zones
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {brief.metrics.criticalZones.map((zone, idx) => (
                      <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {brief.metrics.resourceGaps.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Resource Gaps Identified</h4>
                  <ul className="space-y-1">
                    {brief.metrics.resourceGaps.map((gap, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.metrics.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    Recommended Actions
                  </h4>
                  <ol className="space-y-1">
                    {brief.metrics.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="font-semibold text-blue-600 mr-2">{idx + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
