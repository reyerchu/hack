import { useState } from 'react';

interface ChallengeFormProps {
  challenge?: Challenge;
  onSubmitClick: (challengeData: Challenge) => Promise<void>;
  formAction: 'Edit' | 'Add';
}

export default function ChallengeForm({
  challenge,
  onSubmitClick,
  formAction,
}: ChallengeFormProps) {
  const [disableSubmit, setDisableSubmit] = useState<boolean>(false);
  const [challengeForm, setChallengeForm] = useState<typeof challenge>(
    challenge || {
      description: '',
      organization: '',
      title: '',
      prizes: [],
      rank: -1,
    },
  );
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

      {challengeForm.prizes?.map((prize, idx) => (
        <div key={idx} className="flex gap-x-2 w-full">
          <input
            className="border-2 p-3 rounded-lg w-3/4"
            value={prize}
            key={idx}
            type="text"
            placeholder="輸入獎項"
            onChange={(e) =>
              setChallengeForm((prev) => ({
                ...prev,
                prizes: prev.prizes.map((sp, i) => {
                  if (i === idx) return e.target.value as string;
                  return sp;
                }),
              }))
            }
          ></input>
          <button
            onClick={() =>
              setChallengeForm((prev) => ({
                ...prev,
                prizes: prev.prizes.filter((sp, i) => i !== idx),
              }))
            }
            className="rounded-lg p-2 w-1/4 font-semibold transition-colors"
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
      <button
        onClick={() =>
          setChallengeForm((prev) => ({
            ...prev,
            prizes: prev.prizes ? [...prev.prizes, ''] : [''],
          }))
        }
        className="p-3 rounded-lg font-semibold transition-colors"
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
        新增獎項
      </button>
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
