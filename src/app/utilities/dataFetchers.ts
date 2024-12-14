import { supabase } from './supabaseClient';

export const fetchStateData = async (stateId: string) => {
  const normalizedStateId = stateId.padStart(5, "0");
  console.log(`Fetching state data for GeoFips: ${normalizedStateId}`);

  const { data, error } = await supabase
    .from('industry')
    .select('*')
    .eq('GeoFips', normalizedStateId);

  if (error || !data || data.length === 0) {
    console.error("Error fetching state data:", error, "Response:", data);
    return null;
  }
  return data;
};

export const fetchCountyData = async (countyId: string) => {
  const normalizedCountyId = countyId.padStart(5, "0");
  console.log(`Fetching county data for GeoFips: ${normalizedCountyId}`);

  const { data, error } = await supabase
    .from('industry')
    .select('*')
    .eq('GeoFips', normalizedCountyId);

  if (error || !data || data.length === 0) {
    console.error("Error fetching county data:", error, "Response:", data);
    return null;
  }
  return data;
};