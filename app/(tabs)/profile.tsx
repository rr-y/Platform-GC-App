import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, TextInput, HelperText, Divider, Avatar, Icon } from 'react-native-paper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState('');

  const { mutate: saveName, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/users/me', { name: name.trim() });
      return data;
    },
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['coinBalance'] });
      setEditing(false);
      setError('');
    },
    onError: (e: any) => {
      setError(e?.response?.data?.detail ?? 'Failed to update name.');
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setError('');
    saveName();
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setError('');
    setEditing(false);
  };

  const initials = (user?.name ?? user?.mobile_number ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Avatar.Text size={80} label={initials} style={styles.avatar} />
          <View style={styles.avatarBadge}>
            <Icon source="pencil" size={14} color="#fff" />
          </View>
        </View>
        <Text variant="titleLarge" style={styles.displayName}>
          {user?.name ?? 'No name set'}
        </Text>
        <Text variant="bodyMedium" style={styles.mobile}>{user?.mobile_number}</Text>
      </View>

      <Divider />

      {/* Name edit */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon source="account-edit" size={18} color="#6200ee" />
          <Text variant="labelMedium" style={styles.label}>DISPLAY NAME</Text>
        </View>
        {editing ? (
          <>
            <TextInput
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              mode="outlined"
              autoFocus
              style={styles.input}
              error={!!error}
            />
            <HelperText type="error" visible={!!error}>{error}</HelperText>
            <View style={styles.editActions}>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isPending}
                disabled={isPending}
                style={styles.saveButton}
                icon="check"
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={handleCancel}
                disabled={isPending}
                icon="close"
              >
                Cancel
              </Button>
            </View>
          </>
        ) : (
          <View style={styles.nameRow}>
            <Text variant="bodyLarge" style={styles.nameValue}>
              {user?.name ?? '—'}
            </Text>
            <Button compact mode="text" onPress={() => setEditing(true)} icon="pencil">
              Edit
            </Button>
          </View>
        )}
      </View>

      <Divider />

      {/* Mobile (read-only) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon source="phone" size={18} color="#757575" />
          <Text variant="labelMedium" style={styles.label}>MOBILE NUMBER</Text>
        </View>
        <View style={styles.nameRow}>
          <Text variant="bodyLarge" style={styles.nameValue}>{user?.mobile_number}</Text>
          <View style={styles.verifiedBadge}>
            <Icon source="shield-check" size={14} color="#2e7d32" />
            <Text variant="bodySmall" style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
      </View>

      <Divider />

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          onPress={logout}
          textColor="#c62828"
          style={styles.logoutButton}
          icon="logout"
        >
          Log Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  avatarSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff' },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { backgroundColor: '#6200ee' },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  displayName: { fontWeight: 'bold', color: '#212121' },
  mobile: { color: '#757575', marginTop: 4 },
  section: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { color: '#9e9e9e', letterSpacing: 0.8 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameValue: { color: '#212121' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { color: '#2e7d32' },
  input: { marginBottom: 0 },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  saveButton: { flex: 1 },
  logoutSection: { padding: 24, marginTop: 8 },
  logoutButton: { borderColor: '#c62828' },
});
