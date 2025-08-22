use tezos_smart_rollup::prelude::*;
use tezos_smart_rollup::kernel_entry;
use tezos_smart_rollup::storage::path::RefPath;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;

kernel_entry!(time_oracle_kernel);

#[derive(Serialize, Deserialize, Debug)]
struct TimeRequest {
    pub request_id: String,
    pub required_consensus: u8,
    pub max_time_diff: u64, 
    pub external_timestamps: Option<Vec<u64>>, // Accept external time data
}

#[derive(Serialize, Deserialize, Debug)]
struct TimeResponse {
    pub request_id: String,
    pub timestamp: u64,
    pub consensus_reached: bool,
    pub sources_verified: Vec<String>,
    pub confidence_score: f32,
    pub verification_hash: String,
    pub rollup_level: i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct TimeConsensusResult {
    timestamp: u64,
    consensus_reached: bool,
    sources_verified: Vec<String>,
    confidence_score: f32,
}

fn time_oracle_kernel(host: &mut impl Runtime) {
    debug_msg!(host, "🕐 Time Oracle Kernel Starting...\n");
    
    loop {
        // Read input from rollup inbox
        let input = match host.read_input() {
            Ok(Some(message)) => message,
            Ok(None) => {
                debug_msg!(host, "No messages to process, waiting...\n");
                continue;
            }
            Err(e) => {
                debug_msg!(host, "Error reading input: {:?}\n", e);
                continue;
            }
        };

        debug_msg!(host, "📨 Processing time verification request\n");
        
        // Parse the request
        let data = input.as_ref();
        let request_str = String::from_utf8_lossy(data);
        
        let time_request: TimeRequest = match serde_json::from_str(&request_str) {
            Ok(req) => req,
            Err(e) => {
                debug_msg!(host, "❌ Failed to parse request: {}\n", e);
                // Try to handle simple timestamp requests
                if let Ok(simple_timestamp) = request_str.trim().parse::<u64>() {
                    TimeRequest {
                        request_id: format!("simple_{}", simple_timestamp),
                        required_consensus: 1,
                        max_time_diff: 5,
                        external_timestamps: Some(vec![simple_timestamp]),
                    }
                } else {
                    continue;
                }
            }
        };

        debug_msg!(host, "📋 Processing Request ID: {}\n", time_request.request_id);
        
        // Get consensus time
        let time_result = get_consensus_time(host, &time_request);
        
        // Get current rollup level
        let rollup_level = match host.read_input() {
            Ok(_) => 1, // Simplified - in real implementation, track the actual level
            Err(_) => 0,
        };
        
        // Create response
        let response = TimeResponse {
            request_id: time_request.request_id.clone(),
            timestamp: time_result.timestamp,
            consensus_reached: time_result.consensus_reached,
            sources_verified: time_result.sources_verified.clone(),
            confidence_score: time_result.confidence_score,
            verification_hash: generate_verification_hash(&time_result),
            rollup_level,
        };
        
        let response_json = serde_json::to_string(&response)
            .unwrap_or_else(|_| "Error serializing response".to_string());
        
        debug_msg!(host, "📤 Response: {}\n", response_json);
        
        // Send response back to Layer 1
        match host.write_output(response_json.as_bytes()) {
            Ok(_) => debug_msg!(host, "✅ Time verification completed successfully\n"),
            Err(e) => debug_msg!(host, "❌ Error writing output: {:?}\n", e),
        }
    }
}

fn get_consensus_time(host: &mut impl Runtime, request: &TimeRequest) -> TimeConsensusResult {
    debug_msg!(host, "🔍 Calculating consensus time...\n");
    
    // In a rollup environment, we can't make direct HTTP calls
    // Instead, we work with data provided in the request or use deterministic methods
    
    let timestamps = if let Some(external_timestamps) = &request.external_timestamps {
        debug_msg!(host, "📊 Using {} external timestamps\n", external_timestamps.len());
        external_timestamps.clone()
    } else {
        // Fallback: use a deterministic timestamp based on rollup state
        // In production, external timestamps would be provided by an oracle service
        debug_msg!(host, "⚠️ No external timestamps provided, using fallback\n");
        vec![get_deterministic_timestamp(host)]
    };
    
    let sources_verified = if timestamps.len() > 1 {
        (0..timestamps.len())
            .map(|i| format!("source_{}", i))
            .collect()
    } else {
        vec!["rollup_internal".to_string()]
    };
    
    // Calculate consensus
    let (consensus_timestamp, consensus_reached) = calculate_consensus(
        &timestamps, 
        request.required_consensus as usize,
        request.max_time_diff
    );
    
    let confidence_score = calculate_confidence_score(&timestamps, sources_verified.len());
    
    debug_msg!(host, "📈 Consensus: {} (reached: {})\n", consensus_timestamp, consensus_reached);
    debug_msg!(host, "🎯 Confidence: {:.2}\n", confidence_score);
    
    TimeConsensusResult {
        timestamp: consensus_timestamp,
        consensus_reached,
        sources_verified,
        confidence_score,
    }
}

fn get_deterministic_timestamp(host: &mut impl Runtime) -> u64 {
    // Create a deterministic timestamp based on available rollup data
    // This is a fallback method - in production, use external oracle data
    
    // Use a combination of factors to create a pseudo-timestamp
    // Note: This is not a real timestamp, just a placeholder
    let base_timestamp = 1704067200u64; // Jan 1, 2024 as base
    
    // Add some deterministic variation (this is just for demonstration)
    // In a real implementation, you'd use external data sources
    let path = RefPath::assert_from(b"/timestamp_counter");
    let variation = (host.store_read(&path, 0, 1024)
        .unwrap_or_default()
        .len() as u64) % 86400; // Max 1 day variation
    
    base_timestamp + variation
}

fn calculate_consensus(
    timestamps: &[u64], 
    required_consensus: usize,
    max_time_diff: u64
) -> (u64, bool) {
    if timestamps.is_empty() {
        return (0, false);
    }
    
    if timestamps.len() < required_consensus {
        // Not enough sources, return the most recent timestamp
        let latest = *timestamps.iter().max().unwrap();
        return (latest, false);
    }
    
    // Group timestamps within max_time_diff seconds
    let mut groups: HashMap<u64, Vec<u64>> = HashMap::new();
    
    for &timestamp in timestamps {
        let mut found_group = false;
        
        for (&group_key, group_timestamps) in groups.iter_mut() {
            if timestamp.abs_diff(group_key) <= max_time_diff {
                group_timestamps.push(timestamp);
                found_group = true;
                break;
            }
        }
        
        if !found_group {
            groups.insert(timestamp, vec![timestamp]);
        }
    }
    
    // Find the largest group that meets consensus requirements
    let best_group = groups.values()
        .filter(|group| group.len() >= required_consensus)
        .max_by_key(|group| group.len());
    
    if let Some(group) = best_group {
        // Return median of the consensus group
        let mut sorted_group = group.clone();
        sorted_group.sort();
        let median_idx = sorted_group.len() / 2;
        return (sorted_group[median_idx], true);
    }
    
    // No consensus reached, return median of all timestamps
    let mut sorted_timestamps = timestamps.to_vec();
    sorted_timestamps.sort();
    let median_idx = sorted_timestamps.len() / 2;
    (sorted_timestamps[median_idx], false)
}

fn calculate_confidence_score(timestamps: &[u64], successful_sources: usize) -> f32 {
    if timestamps.is_empty() {
        return 0.0;
    }
    
    // Base score from number of sources (max 3 sources expected)
    let source_score = (successful_sources as f32 / 3.0).min(1.0) * 0.6;
    
    // Consistency score based on timestamp variance
    if timestamps.len() == 1 {
        return source_score + 0.2; // Single source gets lower consistency score
    }
    
    let mean = timestamps.iter().sum::<u64>() as f64 / timestamps.len() as f64;
    let variance = timestamps.iter()
        .map(|&x| (x as f64 - mean).powi(2))
        .sum::<f64>() / timestamps.len() as f64;
    
    // Lower variance = higher consistency score
    let consistency_score = if variance < 25.0 { 
        0.4 
    } else { 
        (0.4 * (25.0 / variance)).min(0.4) as f32
    };
    
    (source_score + consistency_score).min(1.0)
}

fn generate_verification_hash(result: &TimeConsensusResult) -> String {
    let mut hasher = Sha256::new();
    hasher.update(result.timestamp.to_string());
    hasher.update(result.consensus_reached.to_string());
    hasher.update(result.sources_verified.join(","));
    hasher.update(format!("{:.6}", result.confidence_score)); // Consistent precision
    
    format!("{:x}", hasher.finalize())
}