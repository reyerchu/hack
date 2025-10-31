import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import ScanType from '../../../components/ScanType';
import QRScanner from '../../../components/QRScanner';
import LoadIcon from '../../../components/LoadIcon';
import { useAuthContext } from '../../../lib/user/AuthContext';
import { isAuthorized } from '..';
import { RequestHelper } from '../../../lib/request-helper';
import { Dialog } from '@headlessui/react';

const successStrings = {
  claimed: 'Scan claimed...',
  invalidUser: 'Invalid user...',
  alreadyClaimed: 'User has already claimed...',
  unexpectedError: 'Unexpected error...',
  notCheckedIn: "User hasn't checked in!",
  invalidFormat: 'Invalid hacker tag format...',
};

function getSuccessColor(success: string) {
  if (success === successStrings.claimed) {
    return '#5fde05';
  }
  return '#ff0000';
}

/**
 * The admin scanning page.
 *
 * Landing: /admin/scan
 */
export default function Admin() {
  const { user, isSignedIn } = useAuthContext();

  // List of scan types fetched from backend
  const [scanTypes, setScanTypes] = useState([]);

  // Flag whether scan-fetching process is completed
  const [scansFetched, setScansFetched] = useState(false);

  // Current scan
  const [currentScan, setCurrentScan] = useState(undefined);
  const [currentScanIdx, setCurrentScanIdx] = useState(-1);

  // Process data from QR code
  const [scanData, setScanData] = useState(undefined);
  const [success, setSuccess] = useState(undefined);

  // CRUD scantypes and use scan
  const [showNewScanForm, setShowNewScanForm] = useState(false);
  const [newScanForm, setNewScanForm] = useState({
    name: '',
    isCheckIn: false,
  });
  const [startScan, setStartScan] = useState(false);

  const [editScan, setEditScan] = useState(false);
  const [currentEditScan, setCurrentEditScan] = useState(undefined);

  const [showDeleteScanDialog, setShowDeleteScanDialog] = useState(false);

  const handleScanClick = (data, idx) => {
    setCurrentScan(data);
    setCurrentScanIdx(idx);
  };

  const handleScan = async (data: string) => {
    if (!data.startsWith('hack:')) {
      setScanData(data);
      setSuccess(successStrings.invalidFormat);
      return;
    }
    const query = new URL(`http://localhost:3008/api/scan`);
    query.searchParams.append('id', data.replaceAll('hack:', ''));
    fetch(query.toString().replaceAll('http://localhost:3008', ''), {
      mode: 'cors',
      headers: { Authorization: user.token },
      method: 'POST',
      body: JSON.stringify({
        id: data.replaceAll('hack:', ''),
        scan: currentScan.name,
      }),
    })
      .then(async (result) => {
        setScanData(data);
        if (result.status === 404) {
          return setSuccess(successStrings.invalidUser);
        } else if (result.status === 201) {
          return setSuccess(successStrings.alreadyClaimed);
        } else if (result.status === 403) {
          return setSuccess(successStrings.notCheckedIn);
        } else if (result.status !== 200) {
          return setSuccess(successStrings.unexpectedError);
        }
        setSuccess(successStrings.claimed);
      })
      .catch((err) => {
        console.log(err);
        setScanData(data);
        setSuccess('Unexpected error...');
      });
  };

  const updateScan = async () => {
    if (!user.permissions.includes('super_admin')) {
      alert('You do not have the required permission to use this functionality');
      return;
    }
    const updatedScanData = { ...currentEditScan };
    try {
      const { status, data } = await RequestHelper.post<any, any>(
        '/api/scan/update',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: user.token,
          },
        },
        {
          scanData: updatedScanData,
        },
      );
      if (status >= 400) {
        alert(data.msg);
      } else {
        alert(data.msg);
        const newScanTypes = [...scanTypes];
        newScanTypes[currentScanIdx] = updatedScanData;
        setScanTypes(newScanTypes);
        setCurrentScan(updatedScanData);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createNewScan = async () => {
    if (!user.permissions.includes('super_admin')) {
      alert('You do not have the required permission to use this functionality');
      return;
    }
    try {
      const newScan = {
        ...newScanForm,
        precedence: scanTypes.length,
      };
      const { status, data } = await RequestHelper.post<any, any>(
        '/api/scan/create',
        {
          headers: {
            Authorization: user.token,
          },
        },
        {
          ...newScanForm,
          precedence: scanTypes.length,
        },
      );
      if (status >= 400) {
        alert(data.msg);
      } else {
        alert('Scan added');
        setScanTypes((prev) => [...prev, newScan]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteScan = async () => {
    if (!user.permissions.includes('super_admin')) {
      alert('You do not have the required permission to use this functionality');
      return;
    }
    try {
      const { status, data } = await RequestHelper.post<any, any>(
        '/api/scan/delete',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: user.token,
          },
        },
        {
          scanData: currentScan,
        },
      );
      setShowDeleteScanDialog(false);
      if (status >= 400) {
        alert(data.msg);
      } else {
        alert(data.msg);
        const newScanTypes = [...scanTypes];
        newScanTypes.splice(currentScanIdx, 1);
        setScanTypes(newScanTypes);
        setCurrentScan(undefined);
        setCurrentScanIdx(-1);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchScanTypes = () => {
    if (!isSignedIn || scansFetched) return;
    const query = new URL(`http://localhost:3008/api/scantypes`);
    query.searchParams.append('id', user.id);
    fetch(query.toString().replaceAll('http://localhost:3008', ''), {
      mode: 'cors',
      headers: { Authorization: user.token },
      method: 'GET',
    })
      .then(async (result) => {
        if (result.status !== 200) {
          return console.error('Fetch failed for scan-types...');
        }
        const data = await result.json();
        setScanTypes(data);
        setScansFetched(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    fetchScanTypes();
  });

  if (!isSignedIn || !isAuthorized(user))
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
            未授權
          </h1>
          <p className="text-base text-gray-600 mb-8">您沒有權限訪問此頁面</p>
        </div>
      </div>
    );

  return (
    <div className="relative flex flex-col flex-grow min-h-screen bg-gray-50">
      <Head>
        <title>HackPortal - 掃描管理</title>
        <meta name="description" content="HackPortal's Scan Management Page" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-20 w-full">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
            管理儀表板
          </h1>
        </div>
        <AdminHeader />
      {currentScan && (
        <Dialog
          open={showDeleteScanDialog}
          onClose={() => setShowDeleteScanDialog(false)}
          className="fixed z-50 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

            <div className="rounded-lg relative bg-white flex flex-col shadow-xl p-6 max-w-md mx-auto z-50">
              <Dialog.Title className="text-xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
                刪除掃描類型
              </Dialog.Title>

              <div className="mb-6 flex flex-col gap-y-3">
                <Dialog.Description className="text-gray-700">
                  您即將永久刪除 <span className="font-bold" style={{ color: '#1a3a6e' }}>{currentScan.name}</span>
                </Dialog.Description>
                <p className="text-gray-600 text-sm">
                  確定要刪除此掃描類型嗎？此操作無法復原。
                </p>
              </div>

              <div className="flex flex-row justify-end gap-x-3">
                <button
                  className="px-6 py-2 rounded-lg font-medium border-2 transition-colors duration-300"
                  style={{ borderColor: '#dc2626', backgroundColor: '#dc2626', color: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = 'white';
                  }}
                  onClick={async () => {
                    await deleteScan();
                  }}
                >
                  刪除
                </button>
                <button
                  className="px-6 py-2 rounded-lg font-medium border-2 transition-colors duration-300"
                  style={{ borderColor: '#6b7280', color: '#6b7280' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                  onClick={() => setShowDeleteScanDialog(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {showNewScanForm ? (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8 border-2" style={{ borderColor: '#e5e7eb' }}>
          <button
            className="mb-6 px-4 py-2 rounded-lg border-2 transition-colors duration-300"
            style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a3a6e';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#1a3a6e';
            }}
            onClick={() => {
              setShowNewScanForm(false);
            }}
          >
            ← 返回掃描類型列表
          </button>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1a3a6e' }}>
            新增掃描類型
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                掃描類型名稱
              </label>
              <input
                className="p-3 rounded-lg w-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: '#e5e7eb' }}
                type="text"
                name="name"
                value={newScanForm.name}
                onChange={(e) => {
                  setNewScanForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }));
                }}
                placeholder="請輸入掃描類型名稱"
              />
            </div>
            <div className="flex flex-row gap-x-3 items-center mb-6">
              <input
                type="checkbox"
                id="isCheckin"
                name="isCheckin"
                className="w-5 h-5 rounded"
                checked={newScanForm.isCheckIn}
                onChange={(e) => {
                  setNewScanForm((prev) => ({
                    ...prev,
                    isCheckIn: e.target.checked,
                  }));
                }}
              />
              <label htmlFor="isCheckin" className="text-base" style={{ color: '#1a3a6e' }}>
                這是報到活動嗎？
              </label>
            </div>
            <div className="flex justify-center gap-x-4">
              <button
                className="px-8 py-3 rounded-lg font-medium transition-all duration-300 border-2"
                style={{ 
                  borderColor: '#1a3a6e',
                  backgroundColor: '#1a3a6e',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = 'white';
                }}
                onClick={async () => {
                  await createNewScan();
                }}
              >
                新增掃描類型
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8 border-2" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#1a3a6e' }}>
              掃描類型
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scansFetched ? (
                scanTypes.map((d, idx) => (
                  <ScanType
                    key={d.name}
                    data={d}
                    name={d.name}
                    onClick={() => handleScanClick(d, idx)}
                  />
                ))
              ) : (
                <div className="col-span-full flex justify-center py-12">
                  <LoadIcon width={150} height={150} />
                </div>
              )}
            </div>

            {currentScan && (
              <div className="mt-8 p-6 border-t-2" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex flex-col gap-y-6">
                  <h3 className="text-center text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                    {currentScan ? currentScan.name : ''}
                  </h3>
                  {startScan ? (
                    <>
                      <div className="flex flex-col items-center justify-center gap-y-6">
                        {currentScan && !scanData ? (
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <QRScanner 
                              onScanSuccess={handleScan}
                              onScanError={(error) => console.error('掃描錯誤:', error)}
                              width={350}
                              height={350}
                            />
                          </div>
                        ) : null}

                        {scanData ? (
                          <div
                            className="text-center text-3xl font-bold py-6 px-8 rounded-lg"
                            style={{ 
                              color: getSuccessColor(success),
                              backgroundColor: getSuccessColor(success) === '#5fde05' ? '#f0fdf4' : '#fef2f2'
                            }}
                          >
                            {success ?? 'Unexpected error!'}
                          </div>
                        ) : null}

                        {scanData ? (
                          <div className="flex gap-x-4 items-center justify-center">
                            <button
                              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 border-2"
                              style={{ 
                                borderColor: '#1a3a6e',
                                backgroundColor: '#1a3a6e',
                                color: 'white'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#1a3a6e';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#1a3a6e';
                                e.currentTarget.style.color = 'white';
                              }}
                              onClick={() => {
                                setScanData(undefined);
                              }}
                            >
                              下一個掃描
                            </button>
                            <button
                              className="px-6 py-3 rounded-lg font-medium border-2 transition-colors duration-300"
                              style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1a3a6e';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#1a3a6e';
                              }}
                              onClick={() => {
                                setScanData(undefined);
                                setCurrentScan(undefined);
                                setStartScan(false);
                              }}
                            >
                              完成
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : editScan ? (
                    <>
                      <div className="max-w-2xl mx-auto">
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                            掃描類型名稱
                          </label>
                          <input
                            className="p-3 rounded-lg w-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ borderColor: '#e5e7eb' }}
                            type="text"
                            name="name"
                            value={currentEditScan.name}
                            onChange={(e) => {
                              setCurrentEditScan((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }));
                            }}
                            placeholder="請輸入掃描類型名稱"
                          />
                        </div>
                        <div className="flex flex-row gap-x-3 items-center mb-6">
                          <input
                            type="checkbox"
                            id="isCheckin-edit"
                            name="isCheckin"
                            className="w-5 h-5 rounded"
                            checked={currentEditScan.isCheckIn}
                            onChange={(e) => {
                              setCurrentEditScan((prev) => ({
                                ...prev,
                                isCheckIn: e.target.checked,
                              }));
                            }}
                          />
                          <label htmlFor="isCheckin-edit" className="text-base" style={{ color: '#1a3a6e' }}>
                            這是報到活動嗎？
                          </label>
                        </div>
                        <div className="flex justify-center gap-x-4">
                          <button
                            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 border-2"
                            style={{ 
                              borderColor: '#1a3a6e',
                              backgroundColor: '#1a3a6e',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#1a3a6e';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#1a3a6e';
                              e.currentTarget.style.color = 'white';
                            }}
                            onClick={async () => {
                              await updateScan();
                            }}
                          >
                            更新掃描資訊
                          </button>
                          <button
                            className="px-6 py-3 rounded-lg font-medium border-2 transition-colors duration-300"
                            style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1a3a6e';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#1a3a6e';
                            }}
                            onClick={() => {
                              setEditScan(false);
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mx-auto flex flex-wrap justify-center gap-4">
                      <button
                        className="px-6 py-3 rounded-lg font-medium transition-all duration-300 border-2"
                        style={{ 
                          borderColor: '#1a3a6e',
                          backgroundColor: '#1a3a6e',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#1a3a6e';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1a3a6e';
                          e.currentTarget.style.color = 'white';
                        }}
                        onClick={() => {
                          setStartScan(true);
                        }}
                      >
                        開始掃描
                      </button>
                      {user.permissions.includes('super_admin') && (
                        <>
                          <button
                            className="px-6 py-3 rounded-lg font-medium border-2 transition-colors duration-300"
                            style={{ borderColor: '#1a3a6e', color: '#1a3a6e' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1a3a6e';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#1a3a6e';
                            }}
                            onClick={() => {
                              if (!user.permissions.includes('super_admin')) {
                                alert('您沒有權限使用此功能');
                                return;
                              }
                              setCurrentEditScan(currentScan);
                              setEditScan(true);
                            }}
                          >
                            編輯
                          </button>
                          <button
                            className="px-6 py-3 rounded-lg font-medium border-2 transition-colors duration-300"
                            style={{ borderColor: '#dc2626', color: '#dc2626' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                            onClick={() => {
                              if (!user.permissions.includes('super_admin')) {
                                alert('您沒有權限使用此功能');
                                return;
                              }
                              if (currentScan.isCheckIn) {
                                alert('報到掃描無法刪除');
                                return;
                              }
                              setShowDeleteScanDialog(true);
                            }}
                          >
                            刪除
                          </button>
                        </>
                      )}
                      <button
                        className="px-6 py-3 rounded-lg font-medium border-2 transition-colors duration-300"
                        style={{ borderColor: '#6b7280', color: '#6b7280' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#6b7280';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                        onClick={() => {
                          setCurrentScan(undefined);
                          setCurrentScanIdx(-1);
                        }}
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!currentScan &&
              !editScan &&
              !showDeleteScanDialog &&
              !startScan &&
              user.permissions.includes('super_admin') && (
                <div className="mt-8 text-center">
                  <button
                    className="px-8 py-3 rounded-lg font-medium transition-all duration-300 border-2"
                    style={{ 
                      borderColor: '#1a3a6e',
                      backgroundColor: '#1a3a6e',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#1a3a6e';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                      e.currentTarget.style.color = 'white';
                    }}
                    onClick={() => {
                      if (!user.permissions.includes('super_admin')) {
                        alert('您沒有權限使用此功能');
                        return;
                      }
                      setShowNewScanForm(true);
                    }}
                  >
                    + 新增掃描類型
                  </button>
                </div>
              )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
