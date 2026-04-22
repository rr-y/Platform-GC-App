import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, HelperText, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from '@tanstack/react-query';
import { uploadPrintFile } from '../../../src/api/print';
import { getApiError } from '../../../src/utils/errors';

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];

export default function NewPrintScreen() {
  const router = useRouter();
  const [error, setError] = useState('');

  const upload = useMutation({
    mutationFn: (asset: DocumentPicker.DocumentPickerAsset) => {
      const mime = asset.mimeType ?? (asset.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : asset.name.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg');
      // `asset.file` is populated on web only — a real File object. Pass it
      // through so the upload uses the browser's multipart builder instead of
      // the RN-only { uri, name, type } idiom.
      return uploadPrintFile(asset.uri, asset.name, mime, asset.file);
    },
    onSuccess: (data) => {
      router.replace({
        pathname: '/(tabs)/print/configure',
        params: {
          uploadId: data.upload_id,
          fileName: data.file_name,
          mimeType: data.mime_type,
          pageCount: String(data.page_count),
        },
      });
    },
    onError: (e: any) => {
      setError(getApiError(e, 'Upload failed. Please try again.'));
    },
  });

  const handlePick = async () => {
    setError('');
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED,
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mime = asset.mimeType ?? '';
    if (!ACCEPTED.includes(mime) && !/\.(pdf|jpg|jpeg|png)$/i.test(asset.name)) {
      setError('Only PDF, JPG or PNG files are supported.');
      return;
    }
    upload.mutate(asset);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={{ alignItems: 'center', paddingVertical: 32 }}>
          <MaterialCommunityIcons name="file-upload-outline" size={64} color="#6200ee" />
          <Text variant="titleMedium" style={styles.title}>
            Pick a file to print
          </Text>
          <Text variant="bodyMedium" style={styles.sub}>
            Accepted formats: PDF, JPG, PNG. Max 25 MB.
          </Text>

          {upload.isPending ? (
            <View style={styles.pending}>
              <ActivityIndicator size="small" color="#6200ee" />
              <Text variant="bodySmall" style={styles.pendingText}>Uploading & counting pages…</Text>
            </View>
          ) : (
            <Button
              mode="contained"
              icon="file-plus"
              onPress={handlePick}
              style={{ marginTop: 20 }}
              contentStyle={{ paddingVertical: 6, paddingHorizontal: 12 }}
            >
              Choose file
            </Button>
          )}

          {!!error && <HelperText type="error" visible style={{ marginTop: 8 }}>{error}</HelperText>}
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={styles.note}>
        Files are deleted from our server as soon as the printer finishes your job.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  card: { borderRadius: 12 },
  title: { fontWeight: 'bold', color: '#212121', marginTop: 12 },
  sub: { color: '#757575', marginTop: 4, textAlign: 'center' },
  pending: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  pendingText: { color: '#757575' },
  note: { color: '#9e9e9e', textAlign: 'center', marginTop: 16 },
});
