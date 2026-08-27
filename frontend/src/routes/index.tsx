import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { SetupWizard } from '../features/setup/SetupWizard';
import { Dashboard } from '../features/dashboard/Dashboard';
import { DailyEntry } from '../features/daily/DailyEntry';
import { ProductionForm } from '../features/production/ProductionForm';
import { SalesList } from '../features/sales/SalesList';
import { SaleForm } from '../features/sales/SaleForm';
import { SaleDetail } from '../features/sales/SaleDetail';
import { CustomerList } from '../features/customers/CustomerList';
import { CustomerDetail } from '../features/customers/CustomerDetail';
import { CashBook } from '../features/cashbook/CashBook';
import { LabourList } from '../features/labour/LabourList';
import { LabourForm } from '../features/labour/LabourForm';
import { LabourDetail } from '../features/labour/LabourDetail';
import { ExpenseList } from '../features/expenses/ExpenseList';
import { ExpenseForm } from '../features/expenses/ExpenseForm';
import { Settings } from '../features/settings/Settings';
import { BackupCenter } from '../features/backup/BackupCenter';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/daily" element={<DailyEntry />} />
      <Route path="/production/new" element={<ProductionForm />} />
      <Route path="/production/edit/:id" element={<ProductionForm />} />
      <Route path="/sales" element={<SalesList />} />
      <Route path="/sales/new" element={<SaleForm />} />
      <Route path="/sales/:id" element={<SaleDetail />} />
      <Route path="/customers" element={<CustomerList />} />
      <Route path="/customers/:id" element={<CustomerDetail />} />
      <Route path="/cashbook" element={<CashBook />} />
      <Route path="/labour" element={<LabourList />} />
      <Route path="/labour/new" element={<LabourForm />} />
      <Route path="/labour/:id" element={<LabourDetail />} />
      <Route path="/expenses" element={<ExpenseList />} />
      <Route path="/expenses/new" element={<ExpenseForm />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/backup" element={<BackupCenter />} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
