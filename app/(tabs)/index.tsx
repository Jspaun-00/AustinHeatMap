// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Modal } from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import Papa from 'papaparse';
import { Ionicons } from '@expo/vector-icons'; 

import AustinData from '../../assets/districts.json';

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1R0ExAnYMjZBEEiw8LGA0kv_pxark31Npoz8rsxFckRA/export?format=csv&gid=0";

export default function MapScreen() {
  const [allCrimes, setAllCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDate, setSelectedDate] = useState('All Time');

  useEffect(() => {
    Papa.parse(SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const cleanData = results.data.filter(row => row['Council District']);
        setAllCrimes(cleanData);
        setLoading(false);
      }
    });
  }, []);

  const filteredCrimes = useMemo(() => {
    if (selectedDate === 'All Time') return allCrimes;
    return allCrimes.filter(c => c['Date/Time']?.includes(selectedDate));
  }, [allCrimes, selectedDate]);

  const districtStats = useMemo(() => {
    if (!selectedDistrict) return null;
    const districtCrimes = filteredCrimes.filter(c => c['Council District']?.toString().trim() === selectedDistrict.toString());
    const total = districtCrimes.length;
    const breakdown = {};
    districtCrimes.forEach(c => {
      const type = c['Crime Type'] || 'Unknown';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return Object.keys(breakdown).map(type => ({
      type, count: breakdown[type],
      percent: total > 0 ? ((breakdown[type] / total) * 100).toFixed(0) : 0
    })).sort((a, b) => b.count - a.count);
  }, [selectedDistrict, filteredCrimes]);

  const parseMultiPolygonWKT = (wkt) => {
    try {
      const regex = /\(([^()]+)\)/g;
      let match;
      let allShapes = [];
      while ((match = regex.exec(wkt)) !== null) {
        const coords = match[1].split(',').map(coordSet => {
          const parts = coordSet.trim().split(' ');
          if (parts.length < 2) return null;
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (lat > 29.5 && lat < 31.5 && lng < -97.0 && lng > -98.5) return { latitude: lat, longitude: lng };
          return null;
        }).filter(p => p !== null);
        if (coords.length >= 3) allShapes.push(coords);
      }
      return allShapes;
    } catch (e) { return []; }
  };

  const getDistrictColor = (dist) => {
    const count = filteredCrimes.filter(c => c['Council District']?.toString().trim() === dist?.toString()).length;
    if (count > 20) return 'rgba(255, 59, 48, 0.7)'; 
    if (count > 5) return 'rgba(255, 149, 0, 0.6)';  
    if (count > 0) return 'rgba(52, 199, 89, 0.5)';  
    return 'rgba(0, 0, 0, 0.1)';                     
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.container}>
      <MapView 
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{ latitude: 30.2672, longitude: -97.7431, latitudeDelta: 0.45, longitudeDelta: 0.45 }}
      >
        {AustinData.data.map((row, i) => {
          const distNum = row[13];
          const shapeParts = parseMultiPolygonWKT(row[9]);
          return shapeParts.map((coords, partIdx) => (
            <Polygon 
              key={`poly-${distNum}-${i}-${partIdx}`}
              coordinates={coords}
              fillColor={getDistrictColor(distNum)}
              strokeColor="white"
              strokeWidth={1}
              tappable={true}
              onPress={() => setSelectedDistrict(distNum)}
            />
          ));
        })}
      </MapView>

      {/* --- TOP UI: YEAR SELECTOR --- */}
      <View style={styles.topContainer} pointerEvents="box-none">
        <View style={styles.segmentedControl}>
          {['All Time', '2024', '2025', '2026'].map((item) => (
            <TouchableOpacity 
              key={item} 
              onPress={() => { setSelectedDate(item); setSelectedDistrict(null); }}
              style={[styles.segmentBtn, selectedDate === item && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, selectedDate === item && styles.segmentTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* --- BOTTOM UI: PERMANENT LEGEND --- */}
      <View style={styles.legendWrapper} pointerEvents="none">
        <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Austin Crime Heatmap</Text>
            <View style={styles.legendRow}>
                <View style={styles.legItem}><View style={[styles.dot, {backgroundColor: '#FF3B30'}]} /><Text style={styles.legText}>High</Text></View>
                <View style={styles.legItem}><View style={[styles.dot, {backgroundColor: '#FF9500'}]} /><Text style={styles.legText}>Med</Text></View>
                <View style={styles.legItem}><View style={[styles.dot, {backgroundColor: '#34C759'}]} /><Text style={styles.legText}>Low</Text></View>
            </View>
        </View>
      </View>

      {/* --- POPUP MODAL: ANALYSIS DETAILS --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedDistrict !== null}
        onRequestClose={() => setSelectedDistrict(null)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.analysisTitle}>District {selectedDistrict}</Text>
                        <Text style={styles.analysisCount}>
                            {filteredCrimes.filter(c => c['Council District'].toString() === selectedDistrict?.toString()).length} Total Incidents
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedDistrict(null)}>
                        <Ionicons name="close-circle" size={36} color="#D1D1D6" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                    {districtStats?.slice(0, 3).map((stat, i) => (
                        <View key={i} style={styles.statSquare}>
                            <Text style={styles.statNum}>{stat.percent}%</Text>
                            <Text style={styles.statName} numberOfLines={1}>{stat.type}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredCrimes
                        .filter(c => c['Council District']?.toString().trim() === selectedDistrict?.toString())
                        .map((item, idx) => (
                            <View key={idx} style={styles.logItem}>
                                <Text style={styles.logType}>{item['Crime Type']}</Text>
                                <Text style={styles.logDate}>{item['Date/Time']}</Text>
                            </View>
                        ))
                    }
                </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { ...StyleSheet.absoluteFillObject },

  // Top Year Bar
  topContainer: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  segmentedControl: { 
    flexDirection: 'row', backgroundColor: 'rgba(242, 242, 247, 0.95)', 
    borderRadius: 14, padding: 3, width: '90%', elevation: 10 
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: 'white', elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  segmentTextActive: { color: '#007AFF' },

  // Legend Bar
  legendWrapper: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  legendCard: { backgroundColor: 'white', padding: 15, borderRadius: 20, width: '80%', elevation: 10 },
  legendTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'center' },
  legItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },

  // Modal Analysis Card
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  analysisCard: { 
    backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, 
    padding: 30, height: '70%', elevation: 20 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  analysisTitle: { fontSize: 32, fontWeight: '900', color: '#1C1C1E' },
  analysisCount: { fontSize: 16, color: '#007AFF', fontWeight: '800' },
  
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  statSquare: { flex: 1, backgroundColor: '#F2F2F7', padding: 12, borderRadius: 18 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#FF3B30' },
  statName: { fontSize: 9, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', marginTop: 4 },

  divider: { height: 1, backgroundColor: '#F2F2F7', marginBottom: 15 },
  logItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  logType: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  logDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 }
});