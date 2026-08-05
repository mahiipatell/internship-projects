import { useCallback, useEffect, useState } from 'react';
import accountService from '../services/account.service';

/**
 * Business-logic hook for accounts — fetch/create/update/delete plus local
 * state. Pure React (no DOM APIs), so it works unchanged in a future React
 * Native screen; only the components consuming it are web-specific.
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return accountService.getAccounts().then((data) => {
      setAccounts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createAccount = useCallback(
    async (data) => {
      await accountService.createAccount(data);
      await refresh();
    },
    [refresh]
  );

  const updateAccount = useCallback(
    async (id, data) => {
      await accountService.updateAccount(id, data);
      await refresh();
    },
    [refresh]
  );

  const deleteAccount = useCallback(
    async (id) => {
      await accountService.deleteAccount(id);
      await refresh();
    },
    [refresh]
  );

  return { accounts, loading, refresh, createAccount, updateAccount, deleteAccount };
}
