import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { getLocalPdfs } from '../database/schema';
import { syncPdfs, startNetworkListener } from '../sync/syncService';
import { useAuthStore } from '../store/authStore';
import { FileText, LogOut, RefreshCw } from 'lucide-react-native';

export default function DashboardScreen({ navigation }: any) {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadPdfs();
    // Start background network listener to sync silently
    const unsubscribe = startNetworkListener(() => {
      loadPdfs();
    });
    
    // Initial sync
    handleSync();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadPdfs = async () => {
    try {
      const data = await getLocalPdfs();
      setPdfs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncPdfs();
    await loadPdfs();
    setSyncing(false);
  };

  const onRefresh = () => {
    setRefresh(true);
    handleSync();
  };

  const openPdf = (pdf: any) => {
    navigation.navigate('PdfViewer', { pdf });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openPdf(item)}>
      <View style={styles.cardIcon}>
        <FileText color="#6366f1" size={32} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.pdfTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.pdfMeta}>MD5: {item.hash.substring(0, 10)}...</Text>
        <Text style={styles.pdfStatus}>{item.localUri ? 'Disponível Offline' : 'Apenas Online'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Olá, {user?.username}</Text>
          <Text style={styles.subtitle}>Seus PDFs (Offline-First)</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSync} style={styles.actionBtn}>
            <RefreshCw size={24} color={syncing ? '#94a3b8' : '#1e293b'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.actionBtn}>
            <LogOut size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {syncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.syncText}>Sincronizando com o servidor...</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={pdfs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <FileText size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nenhum PDF encontrado localmente.</Text>
              <Text style={styles.emptySub}>Puxe para atualizar a sincronização.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e7ff',
    padding: 8,
    gap: 8,
  },
  syncText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  pdfMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  pdfStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
});
