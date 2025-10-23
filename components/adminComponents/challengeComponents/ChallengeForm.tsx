import { useState } from 'react';

interface Prize {
  currency: string;
  amount: number;
  description: string;
}

interface ChallengeFormData {
  description: string;
  organization: string;
  title: string;
  prizes: Prize[];
  rank: number;
}

interface ChallengeFormProps {
  challenge?: Challenge;
  onSubmitClick: (challengeData: any) => Promise<void>;
  formAction: 'Edit' | 'Add';
}

export default function ChallengeForm({
  challenge,
  onSubmitClick,
  formAction,
}: ChallengeFormProps) {
  const [disableSubmit, setDisableSubmit] = useState<boolean>(false);
  const [challengeForm, setChallengeForm] = useState<ChallengeFormData>({
    description: challenge?.description || '',
    organization: challenge?.organization || '',
    title: challenge?.title || '',
    prizes: (challenge?.prizes as any) || [],
    rank: challenge?.rank || -1,
  });

  // State for new prize input
  const [newPrize, setNewPrize] = useState({ currency: 'USD', amount: '', description: '' });

  const addPrize = () => {
    if (newPrize.amount && newPrize.description.trim()) {
      const prizeData: Prize = {
        currency: newPrize.currency,
        amount: parseFloat(newPrize.amount),
        description: newPrize.description,
      };
      setChallengeForm((prev) => ({
        ...prev,
        prizes: prev.prizes ? [...prev.prizes, prizeData] : [prizeData],
      }));
      setNewPrize({ currency: 'USD', amount: '', description: '' });
    }
  };

  const removePrize = (index: number) => {
    setChallengeForm((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((_, i) => i !== index),
    }));
  };
  return (
    <div className="my-3 flex flex-col gap-y-4">
      <input
        value={challengeForm.title}
        onChange={(e) => setChallengeForm((prev) => ({ ...prev, title: e.target.value }))}
        type="text"
        placeholder="輸入挑戰標題"
        className="border-2 p-3 rounded-lg"
      />
      <input
        value={challengeForm.organization}
        onChange={(e) => setChallengeForm((prev) => ({ ...prev, organization: e.target.value }))}
        type="text"
        placeholder="輸入組織/公司名稱"
        className="border-2 p-3 rounded-lg"
      />
      <textarea
        cols={50}
        className="border-2 p-3 rounded-lg"
        value={challengeForm.description}
        placeholder="輸入挑戰描述"
        onChange={(e) => {
          setChallengeForm((prev) => ({
            ...prev,
            description: e.target.value,
          }));
        }}
      />

      {/* Prize Label */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
          獎金（多個獎項請用下方按鈕添加） *
        </label>

        {/* Existing prizes list */}
        <div className="space-y-2 mb-3">
          {challengeForm.prizes?.map((prize: Prize, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <span className="text-sm font-medium" style={{ color: '#059669', minWidth: '60px' }}>
                {prize.currency === 'TWD' ? '台幣' : 'USD'}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: '#1a3a6e', minWidth: '100px' }}
              >
                {prize.amount.toLocaleString()}
              </span>
              <span className="flex-1 text-sm" style={{ color: '#6b7280' }}>
                {prize.description}
              </span>
              <button
                type="button"
                onClick={() => removePrize(idx)}
                className="text-sm px-3 py-1 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7f1d1d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#991b1b';
                }}
              >
                刪除
              </button>
            </div>
          ))}
        </div>

        {/* Add new prize form */}
        <div className="flex gap-3">
          <select
            value={newPrize.currency}
            onChange={(e) => setNewPrize({ ...newPrize, currency: e.target.value })}
            className="px-3 py-2 rounded-lg border-2"
            style={{ borderColor: '#d1d5db', minWidth: '100px' }}
          >
            <option value="USD">USD</option>
            <option value="TWD">台幣</option>
          </select>
          <input
            type="number"
            value={newPrize.amount}
            onChange={(e) => setNewPrize({ ...newPrize, amount: e.target.value })}
            placeholder="金額"
            className="w-32 px-4 py-2 rounded-lg border-2"
            style={{ borderColor: '#d1d5db' }}
          />
          <input
            type="text"
            value={newPrize.description}
            onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
            placeholder="描述（例如：第一名）"
            className="flex-1 px-4 py-2 rounded-lg border-2"
            style={{ borderColor: '#d1d5db' }}
          />
          <button
            type="button"
            onClick={addPrize}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: '#1a3a6e',
              color: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a4a7e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a3a6e';
            }}
          >
            添加
          </button>
        </div>

        {challengeForm.prizes?.length === 0 && (
          <p className="text-xs mt-2" style={{ color: '#dc2626' }}>
            * 請至少添加一個獎金項目
          </p>
        )}
      </div>
      <button
        disabled={disableSubmit}
        onClick={async () => {
          setDisableSubmit(true);
          try {
            await onSubmitClick(challengeForm);
          } catch (error) {
          } finally {
            setDisableSubmit(false);
          }
        }}
        className="p-3 rounded-lg font-semibold transition-colors"
        style={{
          backgroundColor: disableSubmit ? '#9ca3af' : '#1a3a6e',
          color: '#ffffff',
          cursor: disableSubmit ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!disableSubmit) {
            e.currentTarget.style.backgroundColor = '#2a4a7e';
          }
        }}
        onMouseLeave={(e) => {
          if (!disableSubmit) {
            e.currentTarget.style.backgroundColor = '#1a3a6e';
          }
        }}
      >
        {formAction === 'Add' ? '新增' : '儲存'}挑戰
      </button>
    </div>
  );
}
