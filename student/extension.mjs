// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
const DEVICE_STATUS_LABELS = {
  compliant: '보안 기준 충족',
  noncompliant: '보안 기준 미충족',
  unknown: '확인 불가',
};

const SESSION_STATUS_LABELS = {
  active: '활성',
  expired: '만료',
  revoked: '철회됨',
  unknown: '확인 불가',
};

const MODE_LABELS = {
  demo: '예제 자료',
  disconnected: '연결 없음',
  unknown: '확인 불가',
};

const ACCESS_STATUS_LABELS = {
  allowed: '허용',
  denied: '거부',
  unknown: '확인 불가',
};

const EVENT_KIND_LABELS = {
  access: '접속',
  xdr: 'XDR 경보',
};

function formatDeviceStatus(status) {
  return DEVICE_STATUS_LABELS[status] || '확인 불가';
}

function formatSessionStatus(status) {
  return SESSION_STATUS_LABELS[status] || '확인 불가';
}

function formatAccessStatus(status) {
  return ACCESS_STATUS_LABELS[status] || '확인 불가';
}

function formatStateDetail(value, labelMap) {
  if (!value || value === 'unknown') {
    return '확인 불가(unknown)';
  }
  const label = labelMap[value] || '확인 불가';
  return `${label}(${value})`;
}

function getModeText(mode) {
  return MODE_LABELS[mode] || null;
}

export function createStudentView() {
  return {
    renderIdentity(context = {}) {
      const { me, devices, sessions } = context || {};
      const container = document.createElement('div');
      container.className = 'student-identity-container';

      const mode = me?.mode || devices?.mode || sessions?.mode;
      const modeText = getModeText(mode);

      if (me?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '불러오는 중';
        container.appendChild(loadingEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'error') {
        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        const message = me.error?.message ? `연결 실패: ${me.error.message}` : '서버에 연결하지 못했습니다.';
        errorEl.textContent = message;
        container.appendChild(errorEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      if (me?.status === 'ok') {
        const data = me.data || {};
        const user = data.user || {};
        const device = data.device || {};
        const session = data.session || {};

        const dl = document.createElement('dl');
        dl.className = 'identity';

        // 사용자
        const dtUser = document.createElement('dt');
        dtUser.textContent = '사용자';
        const ddUser = document.createElement('dd');
        ddUser.textContent = user.label || user.id || '확인 불가';
        dl.appendChild(dtUser);
        dl.appendChild(ddUser);

        // 기기
        const dtDevice = document.createElement('dt');
        dtDevice.textContent = '기기';
        const ddDevice = document.createElement('dd');
        const deviceName = device.label || device.id || '확인 불가';
        const deviceStatusText = formatDeviceStatus(device.status);
        ddDevice.textContent = `${deviceName} · ${deviceStatusText}`;
        if (device.status === 'noncompliant') {
          ddDevice.className = 'status-warning';
        }
        dl.appendChild(dtDevice);
        dl.appendChild(ddDevice);

        // 세션
        const dtSession = document.createElement('dt');
        dtSession.textContent = '세션';
        const ddSession = document.createElement('dd');
        const sessionId = session.id || '확인 불가';
        const sessionStatusText = formatSessionStatus(session.status);
        ddSession.textContent = `${sessionId} · ${sessionStatusText}`;
        if (session.status === 'expired' || session.status === 'revoked') {
          ddSession.className = 'status-danger';
        }
        dl.appendChild(dtSession);
        dl.appendChild(ddSession);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('p');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        if (devices?.status === 'error' && devices.error?.message) {
          const devErr = document.createElement('p');
          devErr.className = 'student-error';
          devErr.textContent = `기기 목록 연결 실패: ${devices.error.message}`;
          container.appendChild(devErr);
        }
        if (sessions?.status === 'error' && sessions.error?.message) {
          const sessErr = document.createElement('p');
          sessErr.className = 'student-error';
          sessErr.textContent = `세션 목록 연결 실패: ${sessions.error.message}`;
          container.appendChild(sessErr);
        }

        return container;
      }

      // 기본/알 수 없는 상태인 경우
      const fallback = document.createElement('p');
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderDecision(context = {}) {
      const { status = 'idle', mode, data, error, appId } = context || {};
      const container = document.createElement('div');
      container.className = 'student-decision-container';

      const modeText = getModeText(mode);

      // 1. 요청 전 (idle)
      if (status === 'idle') {
        const idleEl = document.createElement('p');
        idleEl.className = 'state state-empty';
        idleEl.textContent = '앱을 골라 접속을 요청하세요.';
        container.appendChild(idleEl);
        return container;
      }

      // 2. 요청 중 (loading)
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'state state-loading';
        loadingEl.textContent = '판정 확인 중...';
        container.appendChild(loadingEl);
        return container;
      }

      // 3. 요청 실패 (error) - 거부(deny) 판정이 아님을 명시
      if (status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'decision decision-failed';

        const titleEl = document.createElement('p');
        const errorMsg = error?.message ? `요청 실패: ${error.message}` : '요청 실패: 판정 요청 중 오류가 발생했습니다.';
        titleEl.textContent = errorMsg;
        errorBox.appendChild(titleEl);

        const noticeEl = document.createElement('p');
        noticeEl.className = 'muted';
        noticeEl.textContent = '서버 통신 또는 요청 처리 실패입니다. 정책 기준에 따른 접근 거부(deny) 판정이 아니며, 접속이 허용되지 않았습니다.';
        errorBox.appendChild(noticeEl);

        container.appendChild(errorBox);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 4. 판정 수신 (ok)
      if (status === 'ok') {
        const targetAppId = (data && data.appId) || appId || '확인 불가';
        const rawDecision = data && data.decision;
        const reason = (data && data.reason) || '판정 사유 없음';
        const checkedAt = (data && data.checkedAt) || '확인 시각 없음';

        let decisionLabel = '판정 확인 불가(unknown)';
        let decisionClass = 'decision-unknown';
        let decisionNote = '판정을 확인할 수 없습니다. 접속이 허용되지 않았습니다.';

        if (rawDecision === 'allow') {
          decisionLabel = '접근 허용(allow)';
          decisionClass = 'decision-allow';
          decisionNote = '정책상 접근이 허용되었습니다. (실제 앱 접속 성공을 보장하지는 않습니다.)';
        } else if (rawDecision === 'deny') {
          decisionLabel = '접근 거부(deny)';
          decisionClass = 'decision-deny';
          decisionNote = '정책 기준에 따라 접근이 거부되었습니다.';
        } else if (rawDecision === 'challenge') {
          decisionLabel = '추가 인증 또는 확인 필요(challenge)';
          decisionClass = 'decision-challenge';
          decisionNote = '추가 인증 또는 확인이 필요합니다. (이 앱이 확인 절차를 대신하지 않습니다.)';
        }

        const decisionBox = document.createElement('div');
        decisionBox.className = `decision ${decisionClass}`;

        const headEl = document.createElement('p');
        headEl.textContent = `${decisionLabel} · ${targetAppId}`;
        decisionBox.appendChild(headEl);

        const noteEl = document.createElement('p');
        noteEl.className = 'muted';
        noteEl.textContent = decisionNote;
        decisionBox.appendChild(noteEl);

        container.appendChild(decisionBox);

        // 상세 정보 (대상 앱, 판정 이유, 판정 시각)
        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtApp = document.createElement('dt');
        dtApp.textContent = '대상 앱';
        const ddApp = document.createElement('dd');
        ddApp.textContent = targetAppId;
        dl.appendChild(dtApp);
        dl.appendChild(ddApp);

        const dtReason = document.createElement('dt');
        dtReason.textContent = '판정 이유';
        const ddReason = document.createElement('dd');
        ddReason.textContent = reason;
        dl.appendChild(dtReason);
        dl.appendChild(ddReason);

        const dtTime = document.createElement('dt');
        dtTime.textContent = '판정 시각';
        const ddTime = document.createElement('dd');
        ddTime.textContent = checkedAt;
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        container.appendChild(dl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // 기본/알 수 없는 상태
      const fallback = document.createElement('p');
      fallback.className = 'state state-empty';
      fallback.textContent = '판정 확인 불가(unknown) · 판정 요청 대기 중 (접속이 허용되지 않았습니다)';
      container.appendChild(fallback);
      return container;
    },
    renderEvents(context = {}) {
      const { status = 'idle', mode, data, error } = context || {};
      const container = document.createElement('div');
      container.className = 'student-events-container';

      const modeText = getModeText(mode);

      // 1. 로딩 상태
      if (status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '기록을 불러오는 중...';
        container.appendChild(loadingEl);
        return container;
      }

      // 2. 오류 상태 (빈 목록과 명확히 구분)
      if (status === 'error') {
        const errorEl = document.createElement('p');
        errorEl.className = 'student-error';
        const errorMsg = error?.message ? `기록을 불러오지 못했습니다: ${error.message}` : '기록을 불러오지 못했습니다.';
        errorEl.textContent = errorMsg;
        container.appendChild(errorEl);

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }
        return container;
      }

      // 3. 계약 불일치 또는 미확인 상태 (이전 내용 제거 후 확인 불가 안내)
      if (status === 'CONTRACT_MISMATCH') {
        const fallback = document.createElement('p');
        fallback.className = 'student-error';
        fallback.textContent = '확인 불가 (계약 불일치)';
        container.appendChild(fallback);
        return container;
      }

      // 4. 정상 응답 (ok)
      if (status === 'ok') {
        const rawEvents = Array.isArray(data) ? data : [];

        // 빈 배열 처리 (실패 화면과 완전히 다르게 표시)
        if (rawEvents.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '표시할 기록이 없습니다';
          container.appendChild(emptyEl);

          if (modeText) {
            const modeBadge = document.createElement('span');
            modeBadge.className = 'tag tag-demo';
            modeBadge.textContent = modeText;
            container.appendChild(modeBadge);
          }
          return container;
        }

        // 1) 원본 배열을 수정하지 않고 복사하여 at 기준 최신순 정렬
        const sortedEvents = [...rawEvents].sort((a, b) => {
          const timeA = a.at ? new Date(a.at).getTime() : 0;
          const timeB = b.at ? new Date(b.at).getTime() : 0;
          return timeB - timeA;
        });

        // 3) '기록 종류', '업무 앱', '접속 상태' 필터 생성
        const uniqueKinds = [...new Set(sortedEvents.map((e) => e.kind).filter(Boolean))];
        const uniqueApps = [...new Set(sortedEvents.map((e) => ((e.appId !== undefined && e.appId !== null) ? String(e.appId) : '')).filter((v) => v !== ''))];
        const uniqueAccess = [...new Set(sortedEvents.map((e) => e.state?.access).filter(Boolean))];

        const filterBar = document.createElement('div');
        filterBar.className = 'student-filter-bar';

        // 기록 종류 필터
        const kindGroup = document.createElement('div');
        kindGroup.className = 'student-filter-group';
        const kindLabel = document.createElement('label');
        kindLabel.textContent = '기록 종류';
        kindLabel.htmlFor = 'student-filter-kind';
        const kindSelect = document.createElement('select');
        kindSelect.id = 'student-filter-kind';
        kindSelect.setAttribute('aria-label', '기록 종류');

        const kindAllOpt = document.createElement('option');
        kindAllOpt.value = 'all';
        kindAllOpt.textContent = '전체';
        kindSelect.appendChild(kindAllOpt);

        uniqueKinds.forEach((k) => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k === 'access' ? '접속(access)' : (k === 'xdr' ? 'XDR 경보(xdr)' : k);
          kindSelect.appendChild(opt);
        });
        kindGroup.appendChild(kindLabel);
        kindGroup.appendChild(kindSelect);
        filterBar.appendChild(kindGroup);

        // 업무 앱 필터
        const appGroup = document.createElement('div');
        appGroup.className = 'student-filter-group';
        const appLabel = document.createElement('label');
        appLabel.textContent = '업무 앱';
        appLabel.htmlFor = 'student-filter-app';
        const appSelect = document.createElement('select');
        appSelect.id = 'student-filter-app';
        appSelect.setAttribute('aria-label', '업무 앱');

        const appAllOpt = document.createElement('option');
        appAllOpt.value = 'all';
        appAllOpt.textContent = '전체';
        appSelect.appendChild(appAllOpt);

        uniqueApps.forEach((app) => {
          const opt = document.createElement('option');
          opt.value = app;
          opt.textContent = app;
          appSelect.appendChild(opt);
        });
        appGroup.appendChild(appLabel);
        appGroup.appendChild(appSelect);
        filterBar.appendChild(appGroup);

        // 접속 상태 필터
        const accessGroup = document.createElement('div');
        accessGroup.className = 'student-filter-group';
        const accessLabel = document.createElement('label');
        accessLabel.textContent = '접속 상태';
        accessLabel.htmlFor = 'student-filter-access';
        const accessSelect = document.createElement('select');
        accessSelect.id = 'student-filter-access';
        accessSelect.setAttribute('aria-label', '접속 상태');

        const accessAllOpt = document.createElement('option');
        accessAllOpt.value = 'all';
        accessAllOpt.textContent = '전체';
        accessSelect.appendChild(accessAllOpt);

        uniqueAccess.forEach((acc) => {
          const opt = document.createElement('option');
          opt.value = acc;
          const accLabel = acc === 'allowed' ? '허용(allowed)' : (acc === 'denied' ? '거부(denied)' : (acc === 'unknown' ? '확인 불가(unknown)' : acc));
          opt.textContent = accLabel;
          accessSelect.appendChild(opt);
        });
        accessGroup.appendChild(accessLabel);
        accessGroup.appendChild(accessSelect);
        filterBar.appendChild(accessGroup);

        container.appendChild(filterBar);

        // 4) 상세 영역 (data-student-event-detail)
        const detailContainer = document.createElement('div');
        detailContainer.className = 'student-event-detail';
        container.appendChild(detailContainer);

        function renderDetail(ev) {
          detailContainer.replaceChildren();
          if (!ev) {
            detailContainer.removeAttribute('data-student-event-detail');
            return;
          }

          detailContainer.setAttribute('data-student-event-detail', ev.id || '');

          const detailTitle = document.createElement('h3');
          detailTitle.textContent = `${ev.id} 상세`;
          detailContainer.appendChild(detailTitle);

          // 사건 ID 및 appId
          const metaDl = document.createElement('dl');
          metaDl.className = 'kv';

          const dtId = document.createElement('dt');
          dtId.textContent = '사건 ID';
          const ddId = document.createElement('dd');
          ddId.textContent = ev.id || '확인 불가';
          metaDl.appendChild(dtId);
          metaDl.appendChild(ddId);

          const dtApp = document.createElement('dt');
          dtApp.textContent = '업무 앱';
          const ddApp = document.createElement('dd');
          ddApp.textContent = ev.appId ? ev.appId : '앱 확인 불가 (없음)';
          metaDl.appendChild(dtApp);
          metaDl.appendChild(ddApp);

          detailContainer.appendChild(metaDl);

          // 상태 정보 (access·session·device 세 상태의 원래 값과 한국어 설명)
          const stateBox = document.createElement('div');
          stateBox.className = 'student-detail-state-box';

          const stateHeading = document.createElement('h4');
          stateHeading.textContent = '접속 및 보안 상태';
          stateBox.appendChild(stateHeading);

          const stateDl = document.createElement('dl');
          stateDl.className = 'kv';

          const dtAccess = document.createElement('dt');
          dtAccess.textContent = '접속 상태';
          const ddAccess = document.createElement('dd');
          ddAccess.textContent = formatStateDetail(ev.state?.access, ACCESS_STATUS_LABELS);
          stateDl.appendChild(dtAccess);
          stateDl.appendChild(ddAccess);

          const dtSession = document.createElement('dt');
          dtSession.textContent = '세션 상태';
          const ddSession = document.createElement('dd');
          ddSession.textContent = formatStateDetail(ev.state?.session, SESSION_STATUS_LABELS);
          stateDl.appendChild(dtSession);
          stateDl.appendChild(ddSession);

          const dtDevice = document.createElement('dt');
          dtDevice.textContent = '기기 상태';
          const ddDevice = document.createElement('dd');
          ddDevice.textContent = formatStateDetail(ev.state?.device, DEVICE_STATUS_LABELS);
          stateDl.appendChild(dtDevice);
          stateDl.appendChild(ddDevice);

          stateBox.appendChild(stateDl);
          detailContainer.appendChild(stateBox);

          // evidence (근거)
          const evidenceBox = document.createElement('div');
          evidenceBox.className = 'student-detail-evidence';
          const evidenceHeading = document.createElement('h4');
          evidenceHeading.textContent = '근거 (evidence)';
          evidenceBox.appendChild(evidenceHeading);

          const evList = Array.isArray(ev.evidence) ? ev.evidence : [];
          if (evList.length === 0) {
            const noEv = document.createElement('p');
            noEv.className = 'muted';
            noEv.textContent = '근거 없음';
            evidenceBox.appendChild(noEv);
          } else {
            const evUl = document.createElement('ul');
            evList.forEach((entry) => {
              const li = document.createElement('li');
              li.textContent = `${entry.id || ''}: ${entry.text || ''}`;
              evUl.appendChild(li);
            });
            evidenceBox.appendChild(evUl);
          }
          detailContainer.appendChild(evidenceBox);

          // rules (규칙)
          const rulesBox = document.createElement('div');
          rulesBox.className = 'student-detail-rules';
          const rulesHeading = document.createElement('h4');
          rulesHeading.textContent = '규칙 (rules)';
          rulesBox.appendChild(rulesHeading);

          const rulesList = Array.isArray(ev.rules) ? ev.rules : [];
          if (rulesList.length === 0) {
            const noRules = document.createElement('p');
            noRules.className = 'muted';
            noRules.textContent = '규칙 없음';
            rulesBox.appendChild(noRules);
          } else {
            const rulesUl = document.createElement('ul');
            rulesList.forEach((rule) => {
              const li = document.createElement('li');
              li.textContent = `${rule.id || ''}: ${rule.text || ''}`;
              rulesUl.appendChild(li);
            });
            rulesBox.appendChild(rulesUl);
          }
          detailContainer.appendChild(rulesBox);

          // 16단계: supportedActions가 비어 있으면 조치 버튼을 추가하지 않음
          const actions = Array.isArray(ev.supportedActions) ? ev.supportedActions : [];
          if (actions.length > 0) {
            const actionsBox = document.createElement('div');
            actionsBox.className = 'student-detail-actions';

            const actionsHeading = document.createElement('h4');
            actionsHeading.textContent = '조치 (actions)';
            actionsBox.appendChild(actionsHeading);

            const actionsNotice = document.createElement('p');
            actionsNotice.className = 'muted';
            actionsNotice.textContent = '조치 실행 연결은 준비 중입니다. 현재 이 조치를 지원하지 않습니다.';
            actionsBox.appendChild(actionsNotice);

            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'student-action-buttons';

            actions.forEach((act) => {
              const actBtn = document.createElement('button');
              actBtn.type = 'button';
              actBtn.className = 'btn btn-sm btn-disabled';
              actBtn.disabled = true;
              actBtn.textContent = `${act} 미지원`;
              actBtn.setAttribute('aria-label', `${act} 미지원`);
              buttonGroup.appendChild(actBtn);
            });

            actionsBox.appendChild(buttonGroup);
            detailContainer.appendChild(actionsBox);
          }
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'student-events-list';
        container.appendChild(listContainer);

        let currentKindFilter = 'all';
        let currentAppFilter = 'all';
        let currentAccessFilter = 'all';
        let selectedEventId = null;

        function updateList() {
          listContainer.replaceChildren();

          const filtered = sortedEvents.filter((ev) => {
            if (currentKindFilter !== 'all' && ev.kind !== currentKindFilter) return false;
            if (currentAppFilter !== 'all') {
              const appVal = (ev.appId !== undefined && ev.appId !== null) ? String(ev.appId) : '';
              if (appVal !== currentAppFilter) return false;
            }
            if (currentAccessFilter !== 'all' && ev.state?.access !== currentAccessFilter) return false;
            return true;
          });

          if (filtered.length === 0) {
            const noResult = document.createElement('p');
            noResult.className = 'student-empty';
            noResult.textContent = '조건에 일치하는 기록이 없습니다.';
            listContainer.appendChild(noResult);
            return;
          }

          // 2) 각 행에 id·시각·종류(kind)·앱(appId)·요약(summary)을 표시하고 data-student-event-id 부여
          filtered.forEach((ev) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'student-event-item';
            itemEl.setAttribute('data-student-event-id', ev.id || '');

            const headEl = document.createElement('div');
            headEl.className = 'student-event-header';

            const idEl = document.createElement('strong');
            idEl.className = 'student-event-id';
            idEl.textContent = `사건 ID: ${ev.id || '확인 불가'}`;
            headEl.appendChild(idEl);

            const kindText = ev.kind === 'access' ? '접속' : (ev.kind === 'xdr' ? 'XDR 경보' : (ev.kind || '확인 불가'));
            const kindEl = document.createElement('span');
            kindEl.className = 'student-event-kind';
            kindEl.textContent = `종류: ${kindText} (${ev.kind || 'unknown'})`;
            headEl.appendChild(kindEl);

            const timeText = ev.at ? `${ev.at} (${new Date(ev.at).toLocaleString('ko-KR')})` : '시각 확인 불가';
            const timeEl = document.createElement('span');
            timeEl.className = 'student-event-time';
            timeEl.textContent = `시각: ${timeText}`;
            headEl.appendChild(timeEl);

            const appText = ev.appId ? ev.appId : '앱 확인 불가 (없음)';
            const appEl = document.createElement('span');
            appEl.className = 'student-event-app';
            appEl.textContent = `앱: ${appText}`;
            headEl.appendChild(appEl);

            itemEl.appendChild(headEl);

            const summaryEl = document.createElement('p');
            summaryEl.className = 'student-event-summary';
            summaryEl.textContent = `요약: ${ev.summary || '요약 없음'}`;
            itemEl.appendChild(summaryEl);

            // 4) '<event.id> 상세' 버튼
            const detailBtn = document.createElement('button');
            detailBtn.type = 'button';
            detailBtn.className = 'btn btn-sm student-detail-btn';
            detailBtn.textContent = `${ev.id} 상세`;
            detailBtn.setAttribute('aria-label', `${ev.id} 상세`);
            detailBtn.addEventListener('click', () => {
              if (selectedEventId === ev.id) {
                selectedEventId = null;
                renderDetail(null);
              } else {
                selectedEventId = ev.id;
                renderDetail(ev);
              }
            });
            itemEl.appendChild(detailBtn);

            listContainer.appendChild(itemEl);
          });
        }

        kindSelect.addEventListener('change', (e) => {
          currentKindFilter = e.target.value;
          updateList();
        });

        appSelect.addEventListener('change', (e) => {
          currentAppFilter = e.target.value;
          updateList();
        });

        accessSelect.addEventListener('change', (e) => {
          currentAccessFilter = e.target.value;
          updateList();
        });

        // 최초 목록 렌더링
        updateList();

        if (modeText) {
          const modeBadge = document.createElement('span');
          modeBadge.className = 'tag tag-demo';
          modeBadge.textContent = modeText;
          container.appendChild(modeBadge);
        }

        return container;
      }

      // 기본 미확인 상태
      const fallback = document.createElement('p');
      fallback.textContent = '확인 불가';
      container.appendChild(fallback);
      return container;
    },
    renderStatus(context = {}) {
      const { devices, sessions, notifications, diagnostics, mode } = context || {};
      const container = document.createElement('div');
      container.className = 'student-status-container';

      const modeText = getModeText(mode);

      // --- 1. 기기 목록 (devices) ---
      const devicesSection = document.createElement('section');
      devicesSection.className = 'student-status-section';
      const devicesTitle = document.createElement('h3');
      devicesTitle.textContent = '기기 상태';
      devicesSection.appendChild(devicesTitle);

      if (devices?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '기기 목록을 불러오는 중입니다...';
        devicesSection.appendChild(loadingEl);
      } else if (devices?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `기기 목록을 불러오지 못했습니다: ${devices.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const isTimeout = devices.error?.code === 'ENGINE_TIMEOUT' ||
          devices.error?.code === 'REQUEST_TIMEOUT' ||
          (typeof devices.error?.message === 'string' && (devices.error.message.includes('초과') || devices.error.message.toLowerCase().includes('timeout')));
        if (isTimeout) {
          const timeoutMsg = document.createElement('p');
          timeoutMsg.className = 'status-warning';
          timeoutMsg.textContent = '요청 처리 시간이 초과되었습니다.';
          errorBox.appendChild(timeoutMsg);
        }

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        devicesSection.appendChild(errorBox);
      } else if (devices?.status === 'ok') {
        const devList = Array.isArray(devices.data) ? devices.data : [];
        if (devList.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '등록된 기기가 없음';
          devicesSection.appendChild(emptyEl);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-device-list';
          devList.forEach((dev) => {
            const li = document.createElement('li');
            const label = dev.label || dev.id || '확인 불가';
            const statusLabel = formatDeviceStatus(dev.status);
            li.textContent = `${label} · ${statusLabel}(${dev.status || 'unknown'})`;
            ul.appendChild(li);
          });
          devicesSection.appendChild(ul);
        }
      } else {
        const fallback = document.createElement('p');
        fallback.className = 'muted';
        fallback.textContent = '확인 불가';
        devicesSection.appendChild(fallback);
      }
      container.appendChild(devicesSection);

      // --- 2. 세션 정보 (sessions) ---
      const sessionsSection = document.createElement('section');
      sessionsSection.className = 'student-status-section';
      const sessionsTitle = document.createElement('h3');
      sessionsTitle.textContent = '세션 상태';
      sessionsSection.appendChild(sessionsTitle);

      const sessionNotice = document.createElement('p');
      sessionNotice.className = 'muted';
      sessionNotice.textContent = '세션 조회는 현재 검증된 연결 한 개를 대상으로 하며 과거 세션 전체 목록이 아닙니다.';
      sessionsSection.appendChild(sessionNotice);

      if (sessions?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '세션 정보를 불러오는 중입니다...';
        sessionsSection.appendChild(loadingEl);
      } else if (sessions?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `세션 정보를 불러오지 못했습니다: ${sessions.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const isTimeout = sessions.error?.code === 'ENGINE_TIMEOUT' ||
          sessions.error?.code === 'REQUEST_TIMEOUT' ||
          (typeof sessions.error?.message === 'string' && (sessions.error.message.includes('초과') || sessions.error.message.toLowerCase().includes('timeout')));
        if (isTimeout) {
          const timeoutMsg = document.createElement('p');
          timeoutMsg.className = 'status-warning';
          timeoutMsg.textContent = '요청 처리 시간이 초과되었습니다.';
          errorBox.appendChild(timeoutMsg);
        }

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        sessionsSection.appendChild(errorBox);
      } else if (sessions?.status === 'ok') {
        const sessList = Array.isArray(sessions.data) ? sessions.data : [];
        if (sessList.length === 0) {
          const emptyEl = document.createElement('p');
          emptyEl.className = 'student-empty';
          emptyEl.textContent = '현재 연결 없음';
          sessionsSection.appendChild(emptyEl);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'student-session-list';
          sessList.forEach((sess) => {
            const li = document.createElement('li');
            const idText = sess.id || '확인 불가';
            const statusLabel = formatSessionStatus(sess.status);
            li.textContent = `${idText} · ${statusLabel}(${sess.status || 'unknown'})`;
            ul.appendChild(li);
          });
          sessionsSection.appendChild(ul);
        }
      } else {
        const fallback = document.createElement('p');
        fallback.className = 'muted';
        fallback.textContent = '확인 불가';
        sessionsSection.appendChild(fallback);
      }
      container.appendChild(sessionsSection);

      // --- 3. 알림 (notifications) ---
      const notiSection = document.createElement('section');
      notiSection.className = 'student-status-section';
      const notiTitle = document.createElement('h3');
      notiTitle.textContent = '알림';
      notiSection.appendChild(notiTitle);

      const notiList = Array.isArray(notifications) ? notifications : [];
      if (notiList.length === 0) {
        const emptyNoti = document.createElement('p');
        emptyNoti.className = 'student-empty';
        emptyNoti.textContent = '주의할 알림이 없습니다.';
        notiSection.appendChild(emptyNoti);
      } else {
        const notiUl = document.createElement('ul');
        notiUl.className = 'student-notification-list';
        notiList.forEach((n) => {
          const li = document.createElement('li');
          const resource = n.resource || '확인 불가';
          const code = n.code || 'UNVERIFIED';
          const message = n.message || '알림 내용 없음';
          li.textContent = `${resource} · [${code}] ${message}`;
          notiUl.appendChild(li);
        });
        notiSection.appendChild(notiUl);
      }
      container.appendChild(notiSection);

      // --- 4. 진단 정보 (diagnostics) ---
      const diagSection = document.createElement('section');
      diagSection.className = 'student-status-section';
      const diagTitle = document.createElement('h3');
      diagTitle.textContent = '진단 정보';
      diagSection.appendChild(diagTitle);

      if (diagnostics?.status === 'loading') {
        const loadingEl = document.createElement('p');
        loadingEl.className = 'student-loading';
        loadingEl.textContent = '진단 정보를 불러오는 중입니다...';
        diagSection.appendChild(loadingEl);
      } else if (diagnostics?.status === 'error') {
        const errorBox = document.createElement('div');
        errorBox.className = 'student-error-box';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'student-error';
        errorMsg.textContent = `진단 정보를 불러오지 못했습니다: ${diagnostics.error?.message || '알 수 없는 오류'}`;
        errorBox.appendChild(errorMsg);

        const retryNotice = document.createElement('p');
        retryNotice.className = 'muted';
        retryNotice.textContent = '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.';
        errorBox.appendChild(retryNotice);

        diagSection.appendChild(errorBox);
      } else if (diagnostics?.status === 'ok') {
        const diagData = diagnostics.data || {};
        const safeDiagnostics = {
          requestId: diagData.requestId || '확인 불가',
          component: diagData.component || '확인 불가',
          version: diagData.version || '확인 불가',
          checkedAt: diagData.checkedAt || '확인 불가',
          engineMode: diagData.engine?.mode || '확인 불가',
          engineCode: diagData.engine?.code || '확인 불가',
        };

        const dl = document.createElement('dl');
        dl.className = 'kv';

        const dtReq = document.createElement('dt');
        dtReq.textContent = 'requestId';
        const ddReq = document.createElement('dd');
        ddReq.textContent = safeDiagnostics.requestId;
        dl.appendChild(dtReq);
        dl.appendChild(ddReq);

        const dtComp = document.createElement('dt');
        dtComp.textContent = 'component';
        const ddComp = document.createElement('dd');
        ddComp.textContent = safeDiagnostics.component;
        dl.appendChild(dtComp);
        dl.appendChild(ddComp);

        const dtVer = document.createElement('dt');
        dtVer.textContent = 'version';
        const ddVer = document.createElement('dd');
        ddVer.textContent = safeDiagnostics.version;
        dl.appendChild(dtVer);
        dl.appendChild(ddVer);

        const dtTime = document.createElement('dt');
        dtTime.textContent = 'checkedAt';
        const ddTime = document.createElement('dd');
        ddTime.textContent = safeDiagnostics.checkedAt;
        dl.appendChild(dtTime);
        dl.appendChild(ddTime);

        const dtEngMode = document.createElement('dt');
        dtEngMode.textContent = 'engine.mode';
        const ddEngMode = document.createElement('dd');
        ddEngMode.textContent = safeDiagnostics.engineMode;
        dl.appendChild(dtEngMode);
        dl.appendChild(ddEngMode);

        const dtEngCode = document.createElement('dt');
        dtEngCode.textContent = 'engine.code';
        const ddEngCode = document.createElement('dd');
        ddEngCode.textContent = safeDiagnostics.engineCode;
        dl.appendChild(dtEngCode);
        dl.appendChild(ddEngCode);

        diagSection.appendChild(dl);

        const copyNotice = document.createElement('p');
        copyNotice.className = 'muted';
        copyNotice.textContent = '이 정보는 문제 해결 및 도움 요청에 사용하도록 복사하는 진단 정보입니다.';
        diagSection.appendChild(copyNotice);

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn btn-sm';
        copyBtn.textContent = '도움정보 복사';
        copyBtn.setAttribute('aria-label', '도움정보 복사');

        const copyResultMsg = document.createElement('span');
        copyResultMsg.className = 'copy-result muted';
        copyResultMsg.style.marginLeft = '8px';

        copyBtn.addEventListener('click', async () => {
          try {
            const textToCopy = JSON.stringify({
              requestId: safeDiagnostics.requestId,
              component: safeDiagnostics.component,
              version: safeDiagnostics.version,
              checkedAt: safeDiagnostics.checkedAt,
              engine: {
                mode: safeDiagnostics.engineMode,
                code: safeDiagnostics.engineCode,
              },
            }, null, 2);
            await navigator.clipboard.writeText(textToCopy);
            copyResultMsg.textContent = '도움정보가 클립보드에 복사되었습니다.';
          } catch {
            copyResultMsg.textContent = '복사에 실패했습니다.';
          }
        });

        diagSection.appendChild(copyBtn);
        diagSection.appendChild(copyResultMsg);
      } else {
        const diagNotice = document.createElement('p');
        diagNotice.className = 'muted';
        diagNotice.textContent = '진단 정보가 아직 조회되지 않았습니다. 제공 화면의 점검 기능을 사용하세요.';
        diagSection.appendChild(diagNotice);
      }
      container.appendChild(diagSection);

      if (modeText) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'tag tag-demo';
        modeBadge.textContent = modeText;
        container.appendChild(modeBadge);
      }

      return container;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
