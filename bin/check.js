const _ = require("lodash");

const api = require("../api");
const MergeRequest = require("../models/merge-request");
const logger = require("../logger");
const { checkNewMergeRequests } = require("../utils/assign-merge-requests");
const { sendNotifications } = require("../utils/send-notifications");
const { getMetaUpdates } = require("../utils/updates");
const { handleApprovals } = require("../utils/approvals");
const { reportProblems } = require("../utils/merging-problems");

function getMergeRequestsToUpdate(databaseMergeRequestIds, gitlabMergeRequests) {
  return gitlabMergeRequests
    .filter(({ iid }) => databaseMergeRequestIds[iid])
    .map(mergeRequest => ({
      updateOne: {
        filter: { id: mergeRequest.id, iid: mergeRequest.iid },
        update: {
          ...mergeRequest
        }
      }
    }));
}

function getMergeRequestsToExclude(databaseMergeRequestIds, gitlabMergeRequests) {
  return Object.keys(databaseMergeRequestIds)
    .filter(iid => !gitlabMergeRequests.find(mergeRequest => mergeRequest.iid === parseInt(iid, 10)))
    .map(iid => ({
      updateOne: {
        filter: { iid },
        update: {
          exclude: true
        }
      }
    }));
}

async function updateMergeRequests() {
  const databaseMergeRequestIds = _.keyBy(await MergeRequest.find({ exclude: false }, { iid: 1 }), "iid");
  const gitlabMergeRequests = await api.getOpenedMergeRequests();
  const updateBulkOperations = getMergeRequestsToUpdate(databaseMergeRequestIds, gitlabMergeRequests);
  const excludeBulkOperations = getMergeRequestsToExclude(databaseMergeRequestIds, gitlabMergeRequests);
  const newMergeRequest = gitlabMergeRequests.filter(({ iid }) => !databaseMergeRequestIds[iid]);
  if (updateBulkOperations.length) {
    await MergeRequest.bulkWrite(updateBulkOperations);
  }
  if (excludeBulkOperations.length) {
    await MergeRequest.bulkWrite(excludeBulkOperations);
  }
  await MergeRequest.insertMany(newMergeRequest);
}

updateMergeRequests()
  .then(checkNewMergeRequests)
  .then(getMetaUpdates)
  .then(handleApprovals)
  .then(sendNotifications)
  .then(reportProblems)
  .then(() => {
    logger.info("updated");
    process.exit(0);
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });
