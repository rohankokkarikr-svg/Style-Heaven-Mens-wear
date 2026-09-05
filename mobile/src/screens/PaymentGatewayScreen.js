/**
 * Style Heaven Mens — Mobile Artisan UPI Payment Gateway Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { orderAPI } from '../services/api';
import { showToast } from '../components/common/Toast';
import { formatCurrency, APP_CONFIG } from '../constants/config';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function PaymentGatewayScreen({ route, navigation }) {
  const { orderId } = route.params || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (!orderId) {
      showToast('Invalid order reference', 'error');
      navigation.navigate('HomeTab');
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data } = await orderAPI.getById(orderId);
        setOrder(data);
        if (data?.transaction_id) {
          setRefNo(data.transaction_id);
        }
        if (
          data?.payment_status === 'pending_verification' ||
          data?.status === 'payment_verification_pending'
        ) {
          setSubmitted(true);
        }
      } catch (err) {
        showToast('Failed to load transaction details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSubmitRef = async () => {
    const cleanRef = refNo.replace(/\D/g, '').trim();

    if (!cleanRef || cleanRef.length < 6) {
      showToast('Please enter a valid 12-digit UPI Ref. No. / UTR', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await orderAPI.pay(orderId, {
        payment_method: 'upi_phonepe',
        transaction_id: cleanRef,
        ref_no: cleanRef,
      });

      setSubmitted(true);
      showToast('Payment Ref. No. submitted for Admin Verification! ⏳');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit payment reference', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = async (upiString) => {
    await Clipboard.setStringAsync(upiString);
    setCopiedUpi(true);
    showToast('Artisan UPI ID copied to clipboard! 📋');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Payment Gateway" showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading artisan payment details...</Text>
        </View>
      </View>
    );
  }

  // Determine Artisan Payment Profile
  const primaryArtisan = order?.primary_artisan || order?.items?.[0]?.product?.artisan || null;
  const payeeName = primaryArtisan?.store_name || 'Style Heaven Menswear Workshop';
  const artisanUpiId = primaryArtisan?.upi_id || APP_CONFIG.adminUpiId;
  const totalAmount = order?.total_price || 0;

  // Generate standard UPI Intent URL
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(artisanUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('Order #' + (orderId?.substring(0, 8) || ''))}`;
  const dynamicQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiIntentUrl)}`;

  const handleOpenUpiApp = () => {
    Linking.openURL(upiIntentUrl).catch(() => {
      showToast('Could not launch UPI app. Please scan the QR code instead.', 'warning');
    });
  };

  const handleOpenWhatsAppConfirmation = () => {
    const itemsText = (order?.items || [])
      .map(
        (i) =>
          `• ${i.product?.name || 'Item'} (Size: ${i.size}, Qty: ${i.quantity}) - ₹${(
            (i.price_at_time || 0) * (i.quantity || 1)
          ).toLocaleString()}`
      )
      .join('\n');
    const msg = `⏱️ *UPI Payment Ref. No. Submitted!*\n----------------------------------------\n📦 *Order ID:* #${orderId?.substring(
      0,
      8
    )}\n👤 *Customer Name:* ${order?.users?.name || 'Customer'}\n📞 *Phone:* +91 ${
      order?.phone || ''
    }\n🔑 *Ref. No / UTR:* ${refNo}\n💵 *Total Amount:* ₹${totalAmount?.toLocaleString()}\n\n🛒 *Items:*\n${itemsText}\n========================================\n⌛ *Status:* Pending Admin Verification`;

    Linking.openURL(`https://wa.me/${APP_CONFIG.supportWhatsapp}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Artisan UPI Gateway" showBack={true} showCart={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payee Summary Card */}
        <View style={styles.payeeCard}>
          <View style={styles.payeeLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🧑‍🎨</Text>
            </View>
            <View>
              <View style={styles.payeeNameRow}>
                <Text style={styles.payeeName} numberOfLines={1}>
                  {payeeName}
                </Text>
                <Text style={styles.artisanBadge}>Verified</Text>
              </View>
              <Text style={styles.orderRef}>Order ID: #{orderId?.substring(0, 8)}</Text>
            </View>
          </View>

          <View style={styles.payeeRight}>
            <Text style={styles.payableLabel}>Payable</Text>
            <Text style={styles.payableAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        {/* 100% Direct Artisan Banner */}
        <View style={styles.directBanner}>
          <Text style={styles.directBannerText}>
            ✨ 100% Direct Artisan Settlement • 0% Platform Commission
          </Text>
        </View>

        {!submitted ? (
          <>
            {/* QR Code Container */}
            <View style={[styles.qrContainer, SHADOWS.gold]}>
              <Image
                source={{ uri: dynamicQrCode }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrPayeeName}>{payeeName}</Text>
              <Text style={styles.qrHint}>
                Scan with PhonePe · GPay · Paytm · BHIM
              </Text>
            </View>

            {/* 1-Click Copy UPI ID & Launch App */}
            <View style={styles.upiActionsContainer}>
              <TouchableOpacity
                style={styles.copyUpiBtn}
                onPress={() => handleCopyUpi(artisanUpiId)}
              >
                <Text style={styles.upiLabelText}>
                  UPI ID: <Text style={styles.upiBold}>{artisanUpiId}</Text>
                </Text>
                <Text style={styles.copyActionText}>
                  {copiedUpi ? '✓ Copied' : '📋 Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.launchAppBtn}
                onPress={handleOpenUpiApp}
              >
                <Text style={styles.launchAppText}>
                  ⚡ Open in Installed UPI App (PhonePe / GPay)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reference Number Submission Form */}
            <View style={styles.formCard}>
              <Text style={styles.stepTitle}>Step 2: Submit 12-Digit Ref No. / UTR</Text>
              <Text style={styles.stepSubtitle}>
                Copy the 12-digit UTR / Ref. No. from your UPI payment receipt.
              </Text>

              <Input
                label="UTR / Ref. No. *"
                value={refNo}
                onChangeText={(t) => setRefNo(t.replace(/\D/g, '').slice(0, 12))}
                placeholder="e.g. 423198765432"
                keyboardType="number-pad"
                maxLength={12}
              />

              <Button
                title="Submit Ref. No. for Verification 🚀"
                variant="primary"
                onPress={handleSubmitRef}
                disabled={submitting || !refNo.trim()}
                loading={submitting}
                style={{ width: '100%', marginTop: SPACING.xs }}
              />
            </View>
          </>
        ) : (
          /* Submitted State */
          <View style={styles.submittedCard}>
            <View style={styles.clockCircle}>
              <Text style={styles.clockIcon}>⏳</Text>
            </View>

            <Text style={styles.submittedTitle}>Ref. No. Submitted!</Text>
            <Text style={styles.pendingBadge}>Pending Admin Payment Verification</Text>

            <View style={styles.receiptSummary}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID:</Text>
                <Text style={styles.receiptVal}>#{orderId?.substring(0, 8)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Submitted UTR:</Text>
                <Text style={[styles.receiptVal, { color: COLORS.gold }]}>{refNo}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Total Amount:</Text>
                <Text style={styles.receiptVal}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>

            <Button
              title="Send Receipt on WhatsApp 🚀"
              variant="primary"
              onPress={handleOpenWhatsAppConfirmation}
              style={{ width: '100%', marginBottom: SPACING.md }}
            />

            <Button
              title="Go to My Orders"
              variant="outline"
              onPress={() => navigation.navigate('Orders')}
              style={{ width: '100%' }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  payeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  payeeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    fontSize: 20,
  },
  payeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payeeName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    maxWidth: 140,
  },
  artisanBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
    backgroundColor: COLORS.successLight,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: RADIUS.xs,
    marginLeft: 4,
  },
  orderRef: {
    fontSize: 11,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  payeeRight: {
    alignItems: 'flex-end',
  },
  payableLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  payableAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.gold,
  },
  directBanner: {
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  directBannerText: {
    fontSize: 11,
    color: COLORS.textGold,
    fontWeight: '700',
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
    width: 240,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: RADIUS.md,
  },
  qrPayeeName: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  qrHint: {
    color: '#666666',
    fontSize: 10,
    marginTop: 2,
  },
  upiActionsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  copyUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  upiLabelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  upiBold: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  copyActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gold,
  },
  launchAppBtn: {
    backgroundColor: COLORS.phonePe,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  launchAppText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  submittedCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  clockCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  clockIcon: {
    fontSize: 26,
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pendingBadge: {
    fontSize: 11,
    color: COLORS.gold,
    fontWeight: '700',
    backgroundColor: COLORS.goldMuted,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    marginVertical: SPACING.sm,
  },
  receiptSummary: {
    width: '100%',
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.lg,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
