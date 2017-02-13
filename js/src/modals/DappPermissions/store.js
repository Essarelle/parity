// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import { action, observable, transaction } from 'mobx';

export default class Store {
  @observable accounts = [];
  @observable modalOpen = false;
  @observable whitelist = [];

  constructor (api) {
    this._api = api;

    this.loadWhitelist();
  }

  @action closeModal = () => {
    transaction(() => {
      let addresses = [];
      let defaultAddress = null;
      const checkedAccounts = this.accounts.filter((account) => account.checked);

      if (checkedAccounts.length) {
        addresses = checkedAccounts.length !== this.accounts.length
          ? checkedAccounts.map((account) => account.address)
          : null;
        defaultAddress = checkedAccounts.find((account) => account.default).address;
      }

      this.modalOpen = false;
      this.updateWhitelist(addresses, defaultAddress);
    });
  }

  @action openModal = (accounts) => {
    transaction(() => {
      this.accounts = Object
        .values(accounts)
        .map((account, index) => {
          return {
            address: account.address,
            checked: this.whitelist
              ? this.whitelist.includes(account.address)
              : true,
            default: this.whitelist
              ? this.whitelist[0] === account.address
              : false,
            description: account.meta.description,
            name: account.name
          };
        });
      this.modalOpen = true;
    });
  }

  @action selectAccount = (address) => {
    transaction(() => {
      this.accounts = this.accounts.map((account) => {
        if (account.address === address) {
          account.checked = !account.checked;
          account.default = false;
        }

        return account;
      });

      this.setDefaultAccount((
        this.accounts.find((account) => account.default) ||
        this.accounts.find((account) => account.checked) ||
        {}
      ).address);
    });
  }

  @action setDefaultAccount = (address) => {
    this.accounts = this.accounts.map((account) => {
      if (account.address === address) {
        account.checked = true;
        account.default = true;
      } else if (account.default) {
        account.default = false;
      }

      return account;
    });
  }

  @action setWhitelist = (whitelist) => {
    this.whitelist = whitelist;
  }

  loadWhitelist () {
    return this._api.parity
      .getNewDappsWhitelist()
      .then((whitelist) => {
        this.setWhitelist(whitelist);
      })
      .catch((error) => {
        console.warn('loadWhitelist', error);
      });
  }

  updateWhitelist (whitelist, defaultAddress) {
    return this._api.parity
      .setNewDappsWhitelist(whitelist, defaultAddress)
      .then(() => {
        this.setWhitelist(whitelist);
      })
      .catch((error) => {
        console.warn('updateWhitelist', error);
      });
  }
}
