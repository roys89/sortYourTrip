import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
  useTheme,
} from '@mui/material';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import React from 'react';

const CancellationQuoteModal = ({
  open,
  onClose,
  onConfirm,
  quoteData,
  isExecuting, // Add prop for execution loading state (Phase 4)
}) => {
  const theme = useTheme();

  // Handle potential null or undefined quoteData
  const items = quoteData?.items || [];
  const totalEstimatedRefund = quoteData?.totalEstimatedRefund || 0;

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: `0 8px 40px ${alpha(theme.palette.common.black, 0.1)}`,
          overflow: 'hidden'
        },
      }}
    >
      <DialogTitle sx={{
        py: 2.5,
        px: 3,
        backgroundColor: alpha(theme.palette.warning.main, 0.05),
        borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <AlertTriangle size={20} style={{ color: theme.palette.warning.main }} />
          </Box>
          <Typography variant="h5" sx={{ fontFamily: "Montserrat", fontWeight: 600 }}>
            Confirm Cancellation
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: theme.palette.background.default }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please review the cancellation details below before confirming. Cancellation policies are determined by the suppliers.
        </Typography>

        {items.length > 0 ? (
          items.map((item, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">{item.itemName || 'Unknown Item'}</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ maxHeight: '80px', overflowY: 'auto', my: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                  Policy:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {item.policySummary || 'Policy not available'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Item Price:</Typography>
                <Typography variant="body2" fontWeight="medium">{formatAmount(item.grossPrice || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ color: theme.palette.error.main }}>
                <Typography variant="body2">Cancellation Penalty:</Typography>
                <Typography variant="body2" fontWeight="medium">{formatAmount(item.userPenalty || 0)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ color: theme.palette.success.main, mt: 0.5 }}>
                <Typography variant="body2">Estimated Refund:</Typography>
                <Typography variant="body2" fontWeight="bold">{formatAmount(item.userRefund || 0)}</Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography sx={{ textAlign: 'center', my: 3 }}>
            No cancellation details available.
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: '12px' }}>
          <Typography variant="h6" fontWeight="bold">
            Total Estimated Refund:
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatAmount(totalEstimatedRefund)}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
            <Info size={18} style={{ color: theme.palette.info.main, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: theme.palette.info.dark }}>
                Refunds are processed back to the original payment method and may take 7-14 business days to reflect, subject to supplier and bank processing times.
            </Typography>
        </Box>

      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          onClick={onClose}
          disabled={isExecuting}
          sx={{ borderRadius: '20px', textTransform: 'none', px: 2 }}
        >
          Close
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning" // Match title bar color
          disabled={isExecuting || items.length === 0}
          startIcon={isExecuting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
          sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}
        >
          {isExecuting ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancellationQuoteModal; 