import { useCallback, useEffect, useState } from 'react';
import recurringService from '../services/recurring.service';

export function useRecurring() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    return recurringService.getRules().then((data) => {
      setRules(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRule = useCallback(async (data) => {
    await recurringService.createRule(data);
    await refresh();
  }, [refresh]);

  const updateRule = useCallback(async (id, data) => {
    await recurringService.updateRule(id, data);
    await refresh();
  }, [refresh]);

  const deleteRule = useCallback(async (id) => {
    await recurringService.deleteRule(id);
    await refresh();
  }, [refresh]);

  return { rules, loading, refresh, createRule, updateRule, deleteRule };
}
